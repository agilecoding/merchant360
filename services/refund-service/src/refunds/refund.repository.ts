import type { Db, Filter } from 'mongodb';
import type { RefundDoc } from './refund.model.js';
import { REFUNDS_COL } from './refund.model.js';

export function toApiShape(doc: RefundDoc) {
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

export interface ListRefundsQuery {
  transactionId?: string;
  merchantId?:    string;
  status?:        string;
  page:           number;
  pageSize:       number;
}

export async function listRefunds(db: Db, q: ListRefundsQuery) {
  const filter: Filter<RefundDoc> = {};
  if (q.transactionId) filter.transactionId = q.transactionId;
  if (q.merchantId)    filter.merchantId    = q.merchantId;
  if (q.status)        filter.status        = q.status as RefundDoc['status'];

  const col  = db.collection<RefundDoc>(REFUNDS_COL);
  const skip = (q.page - 1) * q.pageSize;

  const [docs, total] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.pageSize).toArray(),
    col.countDocuments(filter),
  ]);

  return {
    data: docs.map(toApiShape),
    meta: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) },
  };
}
