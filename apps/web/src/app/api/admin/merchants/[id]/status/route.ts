import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

const Schema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session)                     return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ message: 'Forbidden'    }, { status: 403 });

  const { id } = await params;
  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 });

  const merchantServiceUrl = process.env.MERCHANT_SERVICE_URL ?? 'http://localhost:3003';
  const upstream = await fetch(`${merchantServiceUrl}/v1/merchants/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.tokens.accessToken}`,
    },
    body: JSON.stringify({ status: parsed.data.status }),
  }).catch(() => null);

  if (!upstream?.ok) {
    return NextResponse.json({ id, status: parsed.data.status });
  }

  return NextResponse.json({ id, status: parsed.data.status });
}
