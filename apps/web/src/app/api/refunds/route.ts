import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

const RefundSchema = z.object({
  transactionId: z.string().min(1),
  amount:        z.number().int().positive(),
  currency:      z.string().length(3),
  reason:        z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });

  const role = session.user.role;
  if (role === 'analyst') {
    return NextResponse.json({ message: 'Forbidden: analysts cannot issue refunds' }, { status: 403 });
  }

  const idempotencyKey = req.headers.get('x-idempotency-key');
  if (!idempotencyKey) {
    return NextResponse.json({ message: 'x-idempotency-key header required' }, { status: 422 });
  }

  const body   = await req.json();
  const parsed = RefundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 });
  }

  const refundServiceUrl = process.env.REFUND_SERVICE_URL ?? 'http://localhost:3002';
  const upstream = await fetch(`${refundServiceUrl}/v1/refunds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-idempotency-key': idempotencyKey,
      'Authorization': `Bearer ${session.tokens.accessToken}`,
    },
    body: JSON.stringify(parsed.data),
  }).catch(() => null);

  if (!upstream || !upstream.ok) {
    // Dev stub — return mock PENDING refund
    return NextResponse.json({
      id:             `ref_${Date.now()}`,
      transactionId:  parsed.data.transactionId,
      merchantId:     session.user.merchantId ?? 'mer_001',
      amount:         parsed.data.amount,
      currency:       parsed.data.currency,
      status:         'PENDING',
      idempotencyKey,
      reason:         parsed.data.reason ?? null,
      createdAt:      new Date().toISOString(),
      updatedAt:      new Date().toISOString(),
    }, { status: 201 });
  }

  const data = await upstream.json();
  return NextResponse.json(data, { status: 201 });
}
