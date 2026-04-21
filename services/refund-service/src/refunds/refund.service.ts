import { randomUUID } from 'node:crypto';
import type { Db } from 'mongodb';
import type { CreateRefundInput } from './refund.schema.js';
import type { RefundDoc, TransactionDoc } from './refund.model.js';
import { REFUNDS_COL, TRANSACTIONS_COL } from './refund.model.js';

export type RefundResult =
  | { ok: true;  refund: ReturnType<typeof toApiShape> }
  | { ok: false; status: number; message: string };

function toApiShape(doc: RefundDoc) {
  return {
    id:             doc.refundId,
    transactionId:  doc.transactionId,
    merchantId:     doc.merchantId,
    amount:         doc.amount,
    currency:       doc.currency,
    status:         doc.status,
    idempotencyKey: doc.idempotencyKey,
    reason:         doc.reason,
    createdAt:      doc.createdAt.toISOString(),
    updatedAt:      doc.updatedAt.toISOString(),
  };
}

export async function createRefund(
  db: Db,
  input: CreateRefundInput,
  idempotencyKey: string,
): Promise<RefundResult> {
  const refundsCol      = db.collection<RefundDoc>(REFUNDS_COL);
  const transactionsCol = db.collection<TransactionDoc>(TRANSACTIONS_COL);

  // ── Idempotency check ───────────────────────────────────────────────────────
  const existing = await refundsCol.findOne({ idempotencyKey });
  if (existing) {
    return { ok: true, refund: toApiShape(existing) };
  }

  // ── Load & validate transaction ─────────────────────────────────────────────
  const tx = await transactionsCol.findOne({ transactionId: input.transactionId });

  if (!tx) {
    return { ok: false, status: 404, message: 'Transaction not found' };
  }

  if (!['CAPTURED', 'REFUNDED'].includes(tx.status)) {
    return {
      ok: false,
      status: 422,
      message: `Transaction status '${tx.status}' is not eligible for refund`,
    };
  }

  if (tx.currency !== input.currency) {
    return { ok: false, status: 422, message: 'Currency mismatch' };
  }

  const refundedSoFar    = tx.refundedAmount ?? 0;
  const remainingBalance = tx.amount - refundedSoFar;

  if (input.amount > remainingBalance) {
    return {
      ok: false,
      status: 422,
      message: `Refund amount (${input.amount}) exceeds remaining refundable balance (${remainingBalance})`,
    };
  }

  // ── Persist refund + update transaction atomically via session ──────────────
  const session = db.client.startSession();
  let refundDoc: RefundDoc;

  try {
    await session.withTransaction(async () => {
      const now      = new Date();
      const refundId = `ref_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
      const newRefundedAmount = refundedSoFar + input.amount;
      const newTxStatus       = newRefundedAmount >= tx.amount ? 'REFUNDED' : 'CAPTURED';

      refundDoc = {
        _id:            {} as never, // MongoDB will set
        refundId,
        transactionId:  input.transactionId,
        merchantId:     tx.merchantId,
        amount:         input.amount,
        currency:       input.currency,
        status:         'PENDING',
        idempotencyKey,
        reason:         input.reason,
        createdAt:      now,
        updatedAt:      now,
      };

      await refundsCol.insertOne(refundDoc, { session });

      await transactionsCol.updateOne(
        { transactionId: input.transactionId },
        {
          $set: {
            status:        newTxStatus,
            refundedAmount: newRefundedAmount,
            updatedAt:     now,
          },
        },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  return { ok: true, refund: toApiShape(refundDoc!) };
}
