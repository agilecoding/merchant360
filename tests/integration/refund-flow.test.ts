import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';

const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL ?? 'http://localhost:3001';
const REFUND_URL = process.env.REFUND_SERVICE_URL ?? 'http://localhost:3002';

describe('Refund integration flow', () => {
  it('issues a partial refund for a captured transaction', async () => {
    const idempotencyKey = randomUUID();

    const refundRes = await fetch(`${REFUND_URL}/v1/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-idempotency-key': idempotencyKey,
      },
      body: JSON.stringify({
        transactionId: 'txn_test_001',
        amount: 500,
        currency: 'USD',
        reason: 'Customer request',
      }),
    });

    expect(refundRes.status).toBe(201);
    const body = await refundRes.json();
    expect(body.status).toBe('PENDING');
    expect(body.idempotencyKey).toBe(idempotencyKey);
  });

  it('rejects duplicate idempotency key', async () => {
    const idempotencyKey = randomUUID();
    const payload = {
      transactionId: 'txn_test_002',
      amount: 1000,
      currency: 'USD',
    };

    const first = await fetch(`${REFUND_URL}/v1/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-idempotency-key': idempotencyKey },
      body: JSON.stringify(payload),
    });
    expect(first.status).toBe(201);

    const second = await fetch(`${REFUND_URL}/v1/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-idempotency-key': idempotencyKey },
      body: JSON.stringify(payload),
    });
    expect(second.status).toBe(409);
  });
});
