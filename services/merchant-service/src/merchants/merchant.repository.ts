import { randomUUID } from 'node:crypto';
import type { Db, Filter } from 'mongodb';
import type { MerchantDoc } from './merchant.model.js';
import { COLLECTION } from './merchant.model.js';
import type { CreateMerchantInput, UpdateMerchantInput, ListQuery } from './merchant.schema.js';

export function toApiShape(doc: MerchantDoc) {
  return {
    id:        doc.merchantId,
    name:      doc.name,
    email:     doc.email,
    status:    doc.status,
    country:   doc.country,
    currency:  doc.currency,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listMerchants(db: Db, q: ListQuery) {
  const filter: Filter<MerchantDoc> = {};
  if (q.status)  filter.status  = q.status;
  if (q.country) filter.country = q.country;

  const col   = db.collection<MerchantDoc>(COLLECTION);
  const skip  = (q.page - 1) * q.pageSize;

  const [docs, total] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.pageSize).toArray(),
    col.countDocuments(filter),
  ]);

  return {
    data: docs.map(toApiShape),
    meta: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) },
  };
}

export async function getMerchantById(db: Db, id: string) {
  const doc = await db.collection<MerchantDoc>(COLLECTION).findOne({ merchantId: id });
  return doc ? toApiShape(doc) : null;
}

export async function createMerchant(db: Db, input: CreateMerchantInput) {
  const now = new Date();
  const doc: Omit<MerchantDoc, '_id'> = {
    merchantId: `mer_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    name:       input.name,
    email:      input.email,
    status:     input.status,
    country:    input.country,
    currency:   input.currency,
    createdAt:  now,
    updatedAt:  now,
  };
  await db.collection<MerchantDoc>(COLLECTION).insertOne(doc as MerchantDoc);
  return toApiShape(doc as MerchantDoc);
}

export async function updateMerchant(db: Db, id: string, input: UpdateMerchantInput) {
  const col = db.collection<MerchantDoc>(COLLECTION);
  const now = new Date();

  const result = await col.findOneAndUpdate(
    { merchantId: id },
    { $set: { ...input, updatedAt: now } },
    { returnDocument: 'after' },
  );

  return result ? toApiShape(result) : null;
}

export async function deleteMerchant(db: Db, id: string): Promise<boolean> {
  const result = await db.collection<MerchantDoc>(COLLECTION).deleteOne({ merchantId: id });
  return result.deletedCount === 1;
}
