import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

const Schema = z.object({ role: z.enum(['admin', 'analyst', 'merchant']) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session)                     return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ message: 'Forbidden'    }, { status: 403 });

  const { id } = await params;
  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 });

  // Proxy to merchant-service / user store — stub 200 in dev
  return NextResponse.json({ id, role: parsed.data.role });
}