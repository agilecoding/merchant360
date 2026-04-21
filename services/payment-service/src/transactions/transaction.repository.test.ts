import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Db, Collection } from 'mongodb';

// Minimal mock for repository unit tests
const mockToArray  = vi.fn();
const mockCount    = vi.fn();
const mockFindOne  = vi.fn();
const mockSort     = vi.fn();
const mockSkip     = vi.fn();
const mockLimit    = vi.fn();

const mockCursor = { sort: mockSort, skip: mockSkip, limit: mockLimit, toArray: mockToArray };
mockSort.mockReturnValue(mockCursor);
mockSkip.mockReturnValue(mockCursor);
mockLimit.mockReturnValue(mockCursor);

const mockFind = vi.fn(() => mockCursor);

const mockCollection = { find: mockFind, findOne: mockFindOne, countDocuments: mockCount } as unknown as Collection;
const mockDb = { collection: vi.fn(() => mockCollection) } as unknown as Db;

vi.mock('../db.js', () => ({ getDb: () => mockDb }));

import { findTransactions, findTransactionById } from './transaction.repository.js';

const makeDoc = (overrides = {}) => ({
  _id: { toString: () => 'oid' },
  transactionId: 'txn_001',
  merchantId:    'mer_001',
  amount:        10000,
  currency:      'USD',
  status:        'CAPTURED',
  cardLast4:     '4242',
  cardBrand:     'Visa',
  metadata:      {},
  createdAt:     new Date('2024-01-01'),
  updatedAt:     new Date('2024-01-01'),
  ...overrides,
});

describe('findTransactions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns paginated result', async () => {
    mockToArray.mockResolvedValue([makeDoc()]);
    mockCount.mockResolvedValue(1);

    const result = await findTransactions(mockDb, {
      page: 1, pageSize: 20, sort: 'createdAt', order: 'desc',
    });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.data[0].id).toBe('txn_001');
  });

  it('applies merchantId filter', async () => {
    mockToArray.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await findTransactions(mockDb, {
      merchantId: 'mer_999', page: 1, pageSize: 20, sort: 'createdAt', order: 'desc',
    });

    const filter = (mockFind.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(filter.merchantId).toBe('mer_999');
  });
});

describe('findTransactionById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns shaped transaction when found', async () => {
    mockFindOne.mockResolvedValue(makeDoc());
    const tx = await findTransactionById(mockDb, 'txn_001');
    expect(tx?.id).toBe('txn_001');
    expect(tx?.cardLast4).toBe('4242');
  });

  it('returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    const tx = await findTransactionById(mockDb, 'does-not-exist');
    expect(tx).toBeNull();
  });
});
