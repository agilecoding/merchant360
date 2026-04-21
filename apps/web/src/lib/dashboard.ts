import { gqlFetch } from './gql-client';

export interface DashboardStats {
  totalVolumeCents: number;
  totalTransactions: number;
  capturedCount: number;
  failedCount: number;
  refundedCount: number;
  chargebackCount: number;
  currency: string;
}

export interface RecentAlert {
  id: string;
  type: 'chargeback' | 'refund_spike' | 'high_failure' | 'suspicious';
  message: string;
  merchantId: string;
  merchantName: string;
  severity: 'critical' | 'warning' | 'info';
  createdAt: string;
}

const STATS_QUERY = /* GraphQL */ `
  query DashboardStats {
    dashboardStats {
      totalVolumeCents
      totalTransactions
      capturedCount
      failedCount
      refundedCount
      chargebackCount
      currency
    }
  }
`;

const ALERTS_QUERY = /* GraphQL */ `
  query RecentAlerts($limit: Int!) {
    recentAlerts(limit: $limit) {
      id
      type
      message
      merchantId
      merchantName
      severity
      createdAt
    }
  }
`;

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const data = await gqlFetch<{ dashboardStats: DashboardStats }>({
      query: STATS_QUERY,
    });
    return data.dashboardStats;
  } catch {
    // Return zeroed stats if gateway unavailable
    return {
      totalVolumeCents:  0,
      totalTransactions: 0,
      capturedCount:     0,
      failedCount:       0,
      refundedCount:     0,
      chargebackCount:   0,
      currency:          'USD',
    };
  }
}

export async function fetchRecentAlerts(limit = 5): Promise<RecentAlert[]> {
  try {
    const data = await gqlFetch<{ recentAlerts: RecentAlert[] }>({
      query: ALERTS_QUERY,
      variables: { limit },
    });
    return data.recentAlerts;
  } catch {
    return MOCK_ALERTS;
  }
}

// ── Mock alerts for dev/demo ──────────────────────────────────────────────────
const MOCK_ALERTS: RecentAlert[] = [
  {
    id: 'alt_001',
    type: 'chargeback',
    message: '3 new chargebacks on Acme Payments Ltd in the last hour',
    merchantId: 'mer_001',
    merchantName: 'Acme Payments Ltd',
    severity: 'critical',
    createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
  },
  {
    id: 'alt_002',
    type: 'high_failure',
    message: 'Failure rate exceeded 15% for GlobalShop Inc',
    merchantId: 'mer_002',
    merchantName: 'GlobalShop Inc',
    severity: 'warning',
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
  },
  {
    id: 'alt_003',
    type: 'refund_spike',
    message: 'Refund volume up 40% vs prior 24h for Nordic Retail AS',
    merchantId: 'mer_003',
    merchantName: 'Nordic Retail AS',
    severity: 'warning',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'alt_004',
    type: 'suspicious',
    message: 'Unusual transaction velocity detected on PacRim Commerce',
    merchantId: 'mer_004',
    merchantName: 'PacRim Commerce Pte',
    severity: 'critical',
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
  {
    id: 'alt_005',
    type: 'chargeback',
    message: 'Chargeback ratio approaching 1% threshold — Acme Payments Ltd',
    merchantId: 'mer_001',
    merchantName: 'Acme Payments Ltd',
    severity: 'info',
    createdAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
  },
];
