/**
 * capturedTransaction fixture
 *
 * Resolves a CAPTURED transaction ID before each test by querying the
 * payment-service REST API directly. Tests that consume `capturedTxnId`
 * navigate straight to `/transactions/:id` and are guaranteed a
 * refundable transaction regardless of prior test runs.
 *
 * The fixture is read-only — it never mutates data, so no teardown needed.
 * If the seed data is exhausted (all CAPTURED transactions refunded) the
 * fixture throws a clear error rather than silently skipping.
 */

import { test as base } from '@playwright/test';

const PAYMENT_SERVICE = process.env.PAYMENT_SERVICE_URL ?? 'http://localhost:3001';

export interface CapturedTransactionFixtures {
  capturedTxnId: string;
}

export const test = base.extend<CapturedTransactionFixtures>({
  capturedTxnId: async ({ request }, use) => {
    // Fetch first page of CAPTURED transactions from payment-service
    const res = await request.get(`${PAYMENT_SERVICE}/v1/transactions`, {
      params: { status: 'CAPTURED', pageSize: '10', page: '1' },
    });

    if (!res.ok()) {
      throw new Error(
        `payment-service responded ${res.status()} when fetching CAPTURED transactions`,
      );
    }

    const body = await res.json();

    // Support both { data: [...] } and [...] response shapes
    const transactions: Array<{ id: string; status: string }> =
      Array.isArray(body) ? body : (body.data ?? []);

    const captured = transactions.find((t) => t.status === 'CAPTURED');

    if (!captured) {
      throw new Error(
        'No CAPTURED transactions available. Re-seed the database: ' +
          'docker compose --profile seed run --rm mongo-seed',
      );
    }

    await use(captured.id);
    // No teardown — fixture is read-only
  },
});

export { expect } from '@playwright/test';
