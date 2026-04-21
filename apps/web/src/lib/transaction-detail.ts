import { gqlFetch } from './gql-client';
import type { Transaction, Refund, TransactionStatus } from '@merchant360/shared-types';

export interface TimelineEvent {
  id: string;
  status: TransactionStatus;
  label: string;
  description: string;
  timestamp: string;
  terminal: boolean;
}

export interface TransactionDetail extends Transaction {
  timeline: TimelineEvent[];
  refunds: Refund[];
  metadata: Record<string, string>;
}

const DETAIL_QUERY = /* GraphQL */ `
  query TransactionDetail($id: String!) {
    transaction(id: $id) {
      id merchantId amount currency status
      cardLast4 cardBrand createdAt updatedAt
      metadata { key value }
      timeline { id status label description timestamp terminal }
      refunds {
        id transactionId merchantId amount currency
        status idempotencyKey reason createdAt updatedAt
      }
    }
  }
`;

// ── Mock ──────────────────────────────────────────────────────────────────────
function buildMockDetail(id: string): TransactionDetail {
  const base = Date.now() - 3_600_000 * 6;
  const mk   = (offset: number, status: TransactionStatus, label: string, description: string, terminal = false): TimelineEvent => ({
    id:          `evt_${status.toLowerCase()}_${offset}`,
    status,
    label,
    description,
    timestamp:   new Date(base + offset).toISOString(),
    terminal,
  });

  const timeline: TimelineEvent[] = [
    mk(0,           'AUTHORIZED',  'Authorised',      'Card authorisation approved by issuer'),
    mk(2_000,       'CAPTURED',    'Captured',        'Funds captured from customer account'),
    mk(18_000_000,  'REFUNDED',    'Refund Initiated','Partial refund requested by merchant'),
    mk(18_060_000,  'REFUNDED',    'Refund Processed','Refund settled to cardholder', true),
  ];

  const refunds: Refund[] = [
    {
      id:             'ref_0000000001',
      transactionId:  id,
      merchantId:     'mer_001',
      amount:         1499,
      currency:       'USD',
      status:         'PROCESSED',
      idempotencyKey: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      reason:         'Customer request — item returned',
      createdAt:      new Date(base + 18_000_000).toISOString(),
      updatedAt:      new Date(base + 18_060_000).toISOString(),
    },
  ];

  return {
    id,
    merchantId: 'mer_001',
    amount:     4999,
    currency:   'USD',
    status:     'REFUNDED',
    cardLast4:  '4242',
    cardBrand:  'Visa',
    createdAt:  new Date(base).toISOString(),
    updatedAt:  new Date(base + 18_060_000).toISOString(),
    metadata: {
      orderId:     'ORD-2024-00117',
      customerId:  'cus_abc123def456',
      ipAddress:   '203.0.113.42',
      userAgent:   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      sessionId:   'sess_xyz987uvw654',
    },
    timeline,
    refunds,
  };
}

export async function fetchTransactionDetail(id: string): Promise<TransactionDetail | null> {
  try {
    const data = await gqlFetch<{ transaction: TransactionDetail | null }>({
      query: DETAIL_QUERY,
      variables: { id },
    });
    return data.transaction;
  } catch {
    return buildMockDetail(id);
  }
}
