import type { Db, Filter, Sort } from 'mongodb';
import type { TransactionDoc } from './transaction.model.js';
import { COLLECTION } from './transaction.model.js';
import type { ListQuery } from './transaction.schema.js';

export function toApiShape(doc: TransactionDoc) {
  return {
    id:         doc.transactionId,
    merchantId: doc.merchantId,
    amount:     doc.amount,
    currency:   doc.currency,
    status:     doc.status,
    cardLast4:  doc.cardLast4,
    cardBrand:  doc.cardBrand,
    metadata:   doc.metadata ?? {},
    createdAt:  doc.createdAt.toISOString(),
    updatedAt:  doc.updatedAt.toISOString(),
  };
}

export async function findTransactions(db: Db, q: ListQuery) {
  const filter: Filter<TransactionDoc> = {};

  if (q.merchantId) filter.merchantId = q.merchantId;
  if (q.status)     filter.status     = q.status;
  if (q.from || q.to) {
    filter.createdAt = {};
    if (q.from) filter.createdAt.$gte = new Date(q.from);
    if (q.to)   filter.createdAt.$lte = new Date(q.to);
  }

  const sort: Sort = { [q.sort]: q.order === 'asc' ? 1 : -1 };
  const skip = (q.page - 1) * q.pageSize;

  const col = db.collection<TransactionDoc>(COLLECTION);

  const [docs, total] = await Promise.all([
    col.find(filter).sort(sort).skip(skip).limit(q.pageSize).toArray(),
    col.countDocuments(filter),
  ]);

  return {
    data: docs.map(toApiShape),
    meta: {
      page:      q.page,
      pageSize:  q.pageSize,
      total,
      totalPages: Math.ceil(total / q.pageSize),
    },
  };
}

export async function findTransactionById(db: Db, id: string) {
  const col = db.collection<TransactionDoc>(COLLECTION);
  const doc = await col.findOne({ transactionId: id });
  return doc ? toApiShape(doc) : null;
}
