#!/usr/bin/env node
/**
 * Seed deterministic E2E test data into MongoDB.
 * Used by CI Playwright job: node scripts/seed-test-data.js
 *
 * Requires: MONGODB_URI env var (default: mongodb://localhost:27017/merchant360_e2e)
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/merchant360_e2e';

const MERCHANTS = [
  { merchantId: 'mer_001', name: 'Acme Payments Ltd',   status: 'ACTIVE',    country: 'US', currency: 'USD', email: 'ops@acme.example',     createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') },
  { merchantId: 'mer_002', name: 'GlobalShop Inc',       status: 'ACTIVE',    country: 'GB', currency: 'GBP', email: 'fin@global.example',    createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') },
  { merchantId: 'mer_003', name: 'Nordic Retail AS',     status: 'SUSPENDED', country: 'NO', currency: 'EUR', email: 'pay@nordic.example',    createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') },
];

const USERS = [
  { userId: 'usr_admin_001',    email: 'admin@merchant360.dev',    role: 'admin',    name: 'Admin User',    createdAt: new Date() },
  { userId: 'usr_analyst_001',  email: 'analyst@merchant360.dev',  role: 'analyst',  name: 'Analyst User',  createdAt: new Date() },
  { userId: 'usr_merchant_001', email: 'merchant@merchant360.dev', role: 'merchant', name: 'Merchant User', merchantId: 'mer_001', createdAt: new Date() },
];

function makeTransaction(id, status, merchantId = 'mer_001', currency = 'USD') {
  const amount = Math.floor(Math.random() * 90000) + 1000; // 10.00–900.00
  return {
    id,
    merchantId,
    amount,
    currency,
    status,
    cardBrand: 'Visa',
    cardLast4: '4242',
    refundedAmount: 0,
    metadata: { orderId: `ord_${id.slice(-8)}` },
    timeline: [{ event: status, timestamp: new Date(), note: 'Initial' }],
    createdAt: new Date(Date.now() - Math.random() * 30 * 86400000),
    updatedAt: new Date(),
  };
}

// Deterministic set covering all statuses — ensures every Playwright test finds what it needs
const TRANSACTIONS = [
  // CAPTURED — refund tests require at least 3
  makeTransaction('txn_cap_001', 'CAPTURED', 'mer_001', 'USD'),
  makeTransaction('txn_cap_002', 'CAPTURED', 'mer_001', 'USD'),
  makeTransaction('txn_cap_003', 'CAPTURED', 'mer_002', 'GBP'),
  // AUTHORIZED
  makeTransaction('txn_auth_001', 'AUTHORIZED', 'mer_001', 'USD'),
  makeTransaction('txn_auth_002', 'AUTHORIZED', 'mer_002', 'GBP'),
  // REFUNDED
  makeTransaction('txn_ref_001', 'REFUNDED', 'mer_001', 'USD'),
  makeTransaction('txn_ref_002', 'REFUNDED', 'mer_002', 'GBP'),
  // FAILED
  makeTransaction('txn_fail_001', 'FAILED', 'mer_001', 'USD'),
  makeTransaction('txn_fail_002', 'FAILED', 'mer_003', 'EUR'),
  // PENDING
  makeTransaction('txn_pend_001', 'PENDING', 'mer_001', 'USD'),
  // CHARGEBACK
  makeTransaction('txn_cb_001', 'CHARGEBACK', 'mer_002', 'GBP'),
  // CANCELLED
  makeTransaction('txn_can_001', 'CANCELLED', 'mer_001', 'USD'),
];

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();

    // Drop and re-seed for determinism
    await Promise.all([
      db.collection('transactions').drop().catch(() => {}),
      db.collection('merchants').drop().catch(() => {}),
      db.collection('refunds').drop().catch(() => {}),
      db.collection('users').drop().catch(() => {}),
    ]);

    await db.collection('transactions').insertMany(TRANSACTIONS);
    await db.collection('merchants').insertMany(MERCHANTS);
    await db.collection('users').insertMany(USERS);

    // Indexes
    await db.collection('transactions').createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { merchantId: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } },
    ]);
    await db.collection('merchants').createIndex({ merchantId: 1 }, { unique: true });
    await db.collection('refunds').createIndexes([
      { key: { transactionId: 1 } },
      { key: { idempotencyKey: 1 }, unique: true, sparse: true },
    ]);

    console.log(`Seeded: ${TRANSACTIONS.length} transactions, ${MERCHANTS.length} merchants, ${USERS.length} users`);
  } finally {
    await client.close();
  }
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
