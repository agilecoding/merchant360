import type { Refund, CreateRefundInput } from '@merchant360/shared-types';

export type { Refund };

export interface IssueRefundPayload extends CreateRefundInput {
  idempotencyKey: string;
}

export interface RefundResult {
  success: boolean;
  refund?: Refund;
  error?: string;
}

export async function issueRefund(payload: IssueRefundPayload): Promise<RefundResult> {
  const res = await fetch('/api/refunds', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-idempotency-key': payload.idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    return { success: false, error: body.message ?? `Request failed (${res.status})` };
  }

  const refund = await res.json() as Refund;
  return { success: true, refund };
}
