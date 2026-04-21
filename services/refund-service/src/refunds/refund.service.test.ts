import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Db, Collection, ClientSession } from 'mongodb';

// ── Mocks ──────────────────────────────────────────────────────────────────────
const mockFindOneRefund    = vi.fn();
const mockInsertOne        = vi.fn();
const mockFindOneTx        = vi.fn();
const mockUpdateOne        = vi.fn();

const mockRefundsCol      = { findOne: mockFindOneRefund, insertOne: mockInsertOne } as unknown as Collection;
const mockTransactionsCol = { findOne: mockFindOneTx, updateOne: mockUpdateOne } as unknown as Collection;

const mockEndSession = vi.fn();
const mockWithTx     = vi.fn(async (fn: () => Promise<void>) => { await fn(); });
const mockSession    = { withTransaction: mockWithTx, endSession: mockEndSession } as unknown as ClientSession;

const mockDb = {
  collection: vi.fn((name: string) =>
    name === 'refunds' ? mockRefundsCol : mockTransactionsCol,
  ),
  client: { startSession: vi.fn(() => mockSession) },
} as unknown as Db;

vi.mock('../db.js', () => ({ getDb: () => mockDb }));

import { createRefund } from './refund.service.js';

const baseTx = {
  transactionId: 'txn_001',
  merchantId:    'mer_001',
  amount:        10000,
  currency:      'USD',
  status:        'CAPTURED',
  refundedAmount: 0,
};

const baseInput = { transactionId: 'txn_001', amount: 5000, currency: 'USD' };

beforeEach(() => vi.clearAllMocks());

describe('createRefund', () => {
  it('returns existing refund on duplicate idempotency key', async () => {
    const existing = { refundId: 'ref_existing', transactionId: 'txn_001', merchantId: 'mer_001',
      amount: 5000, currency: 'USD', status: 'PENDING', idempotencyKey: 'key1',
      createdAt: new Date(), updatedAt: new Date() };
    mockFindOneRefund.mockResolvedValue(existing);

    const result = await createRefund(mockDb, baseInput, 'key1');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.refund.id).toBe('ref_existing');
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  it('rejects when transaction not found', async () => {
    mockFindOneRefund.mockResolvedValue(null);
    mockFindOneTx.mockResolvedValue(null);

    const result = await createRefund(mockDb, baseInput, 'key2');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it('rejects ineligible transaction status', async () => {
    mockFindOneRefund.mockResolvedValue(null);
    mockFindOneTx.mockResolvedValue({ ...baseTx, status: 'FAILED' });

    const result = await createRefund(mockDb, baseInput, 'key3');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(422);
  });

  it('rejects amount exceeding remaining balance', async () => {
    mockFindOneRefund.mockResolvedValue(null);
    mockFindOneTx.mockResolvedValue({ ...baseTx, refundedAmount: 8000 });

    const result = await createRefund(mockDb, { ...baseInput, amount: 5000 }, 'key4');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(422);
      expect(result.message).toMatch(/remaining/i);
    }
  });

  it('creates refund and updates transaction', async () => {
    mockFindOneRefund.mockResolvedValue(null);
    mockFindOneTx.mockResolvedValue(baseTx);
    mockInsertOne.mockResolvedValue({});
    mockUpdateOne.mockResolvedValue({});

    const result = await createRefund(mockDb, baseInput, 'key5');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.refund.amount).toBe(5000);
      expect(result.refund.status).toBe('PENDING');
    }
    expect(mockInsertOne).toHaveBeenCalledOnce();
    expect(mockUpdateOne).toHaveBeenCalledOnce();
  });

  it('sets transaction to REFUNDED on full refund', async () => {
    mockFindOneRefund.mockResolvedValue(null);
    mockFindOneTx.mockResolvedValue(baseTx);
    mockInsertOne.mockResolvedValue({});
    mockUpdateOne.mockResolvedValue({});

    await createRefund(mockDb, { ...baseInput, amount: 10000 }, 'key6');

    const updateCall = mockUpdateOne.mock.calls[0] as unknown[];
    const updateDoc  = updateCall[1] as { $set: { status: string } };
    expect(updateDoc.$set.status).toBe('REFUNDED');
  });
});
