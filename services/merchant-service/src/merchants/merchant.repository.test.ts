import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Db, Collection } from 'mongodb';

const mockToArray      = vi.fn();
const mockCount        = vi.fn();
const mockFindOne      = vi.fn();
const mockInsertOne    = vi.fn();
const mockFindOneUpdate = vi.fn();
const mockDeleteOne    = vi.fn();
const mockSort         = vi.fn();
const mockSkip         = vi.fn();
const mockLimit        = vi.fn();

const mockCursor = { sort: mockSort, skip: mockSkip, limit: mockLimit, toArray: mockToArray };
mockSort.mockReturnValue(mockCursor);
mockSkip.mockReturnValue(mockCursor);
mockLimit.mockReturnValue(mockCursor);

const mockFind = vi.fn(() => mockCursor);

const mockCol = {
  find: mockFind,
  findOne: mockFindOne,
  insertOne: mockInsertOne,
  findOneAndUpdate: mockFindOneUpdate,
  deleteOne: mockDeleteOne,
  countDocuments: mockCount,
} as unknown as Collection;

const mockDb = { collection: vi.fn(() => mockCol) } as unknown as Db;

import {
  listMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
} from './merchant.repository.js';

const makeDoc = (overrides = {}) => ({
  merchantId: 'mer_001',
  name:       'Acme Ltd',
  email:      'ops@acme.com',
  status:     'ACTIVE',
  country:    'US',
  currency:   'USD',
  createdAt:  new Date('2024-01-01'),
  updatedAt:  new Date('2024-01-01'),
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe('listMerchants', () => {
  it('returns paginated result', async () => {
    mockToArray.mockResolvedValue([makeDoc()]);
    mockCount.mockResolvedValue(1);
    const result = await listMerchants(mockDb, { page: 1, pageSize: 20 });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
});

describe('getMerchantById', () => {
  it('returns shaped merchant when found', async () => {
    mockFindOne.mockResolvedValue(makeDoc());
    const m = await getMerchantById(mockDb, 'mer_001');
    expect(m?.id).toBe('mer_001');
  });

  it('returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getMerchantById(mockDb, 'nope')).toBeNull();
  });
});

describe('createMerchant', () => {
  it('inserts and returns shaped merchant', async () => {
    mockInsertOne.mockResolvedValue({});
    const m = await createMerchant(mockDb, {
      name: 'Test Co', email: 'x@test.com', country: 'GB', currency: 'GBP', status: 'ACTIVE',
    });
    expect(m.name).toBe('Test Co');
    expect(m.id).toMatch(/^mer_/);
    expect(mockInsertOne).toHaveBeenCalledOnce();
  });
});

describe('updateMerchant', () => {
  it('returns updated merchant', async () => {
    mockFindOneUpdate.mockResolvedValue(makeDoc({ status: 'SUSPENDED' }));
    const m = await updateMerchant(mockDb, 'mer_001', { status: 'SUSPENDED' });
    expect(m?.status).toBe('SUSPENDED');
  });

  it('returns null when not found', async () => {
    mockFindOneUpdate.mockResolvedValue(null);
    expect(await updateMerchant(mockDb, 'nope', { status: 'INACTIVE' })).toBeNull();
  });
});

describe('deleteMerchant', () => {
  it('returns true when deleted', async () => {
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
    expect(await deleteMerchant(mockDb, 'mer_001')).toBe(true);
  });

  it('returns false when not found', async () => {
    mockDeleteOne.mockResolvedValue({ deletedCount: 0 });
    expect(await deleteMerchant(mockDb, 'nope')).toBe(false);
  });
});
