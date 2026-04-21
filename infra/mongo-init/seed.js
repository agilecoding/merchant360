// Merchant360 — MongoDB seed script
// Generates 10,000 transactions with realistic distribution across statuses.
// Run via: docker compose --profile seed up mongo-seed

// ── Connection ────────────────────────────────────────────────────────────────
// mongosh is already authenticated via CLI flags — switch to the target db.
use('merchant360');
const db = globalThis.db;

// ── Helpers ───────────────────────────────────────────────────────────────────
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, daysAgo));
  d.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59), 0);
  return d;
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Reference data ────────────────────────────────────────────────────────────
const MERCHANTS = [
  { merchantId: 'mer_001', name: 'Acme Payments Ltd',     email: 'ops@acme.example',          status: 'ACTIVE',    country: 'US', currency: 'USD' },
  { merchantId: 'mer_002', name: 'GlobalShop Inc',         email: 'finance@globalshop.example', status: 'ACTIVE',    country: 'GB', currency: 'GBP' },
  { merchantId: 'mer_003', name: 'Nordic Retail AS',       email: 'billing@nordic.example',     status: 'ACTIVE',    country: 'NO', currency: 'EUR' },
  { merchantId: 'mer_004', name: 'PacRim Commerce Pte',    email: 'accounts@pacrim.example',    status: 'ACTIVE',    country: 'SG', currency: 'SGD' },
  { merchantId: 'mer_005', name: 'Horizon Ventures LLC',   email: 'pay@horizon.example',        status: 'SUSPENDED', country: 'US', currency: 'USD' },
];

const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex', 'Discover', 'UnionPay'];
const CARD_LAST4  = ['4242', '1234', '5678', '0000', '9999', '3782', '6011', '3714'];

// Status distribution (must sum to 1.0)
// AUTHORIZED 15 % | CAPTURED 50 % | FAILED 10 % | REFUNDED 15 % | CHARGEBACK 10 %
const STATUS_WEIGHTS = [
  { status: 'AUTHORIZED',  weight: 0.15 },
  { status: 'CAPTURED',    weight: 0.50 },
  { status: 'FAILED',      weight: 0.10 },
  { status: 'REFUNDED',    weight: 0.15 },
  { status: 'CHARGEBACK',  weight: 0.10 },
];

function pickStatus() {
  const r = Math.random();
  let cum = 0;
  for (const { status, weight } of STATUS_WEIGHTS) {
    cum += weight;
    if (r < cum) return status;
  }
  return 'CAPTURED';
}

// ── Drop & re-create indexes ──────────────────────────────────────────────────
print('→ Creating indexes…');

db.transactions.createIndex({ transactionId: 1 }, { unique: true });
db.transactions.createIndex({ merchantId: 1 });
db.transactions.createIndex({ status: 1 });
db.transactions.createIndex({ createdAt: -1 });
db.transactions.createIndex({ merchantId: 1, status: 1 });
db.transactions.createIndex({ merchantId: 1, createdAt: -1 });

db.refunds.createIndex({ idempotencyKey: 1 }, { unique: true });
db.refunds.createIndex({ transactionId: 1 });
db.refunds.createIndex({ merchantId: 1 });
db.refunds.createIndex({ createdAt: -1 });
db.refunds.createIndex({ status: 1 });

db.merchants.createIndex({ merchantId: 1 }, { unique: true });
db.merchants.createIndex({ status: 1 });

db.users.createIndex({ email: 1 }, { unique: true });

// ── Merchants ─────────────────────────────────────────────────────────────────
print('→ Seeding merchants…');
db.merchants.deleteMany({});
db.merchants.insertMany(
  MERCHANTS.map((m) => ({
    ...m,
    createdAt: randDate(730),
    updatedAt: randDate(30),
  }))
);

// ── Users ─────────────────────────────────────────────────────────────────────
print('→ Seeding users…');
db.users.deleteMany({});
db.users.insertMany([
  { email: 'admin@merchant360.dev',    role: 'admin',    createdAt: new Date() },
  { email: 'analyst@merchant360.dev',  role: 'analyst',  createdAt: new Date() },
  { email: 'merchant@merchant360.dev', role: 'merchant', merchantId: 'mer_001', createdAt: new Date() },
  { email: 'merchant2@merchant360.dev',role: 'merchant', merchantId: 'mer_002', createdAt: new Date() },
]);

// ── Transactions (10,000) ─────────────────────────────────────────────────────
print('→ Seeding 10,000 transactions…');
db.transactions.deleteMany({});

const BATCH_SIZE = 500;
const TOTAL      = 10_000;
let   inserted   = 0;

// Track REFUNDED/CHARGEBACK txn IDs for refund seeding
const refundableTxnIds = [];

while (inserted < TOTAL) {
  const batch = [];
  const batchCount = Math.min(BATCH_SIZE, TOTAL - inserted);

  for (let i = 0; i < batchCount; i++) {
    const merchant   = randItem(MERCHANTS);
    const status     = pickStatus();
    const createdAt  = randDate(365);
    const updatedAt  = new Date(createdAt.getTime() + randInt(1000, 86_400_000));
    const amount     = randInt(100, 250_000); // cents — $1.00 to $2,500.00
    const txnId      = `txn_${uuid().replace(/-/g, '').slice(0, 20)}`;

    const doc = {
      transactionId: txnId,
      merchantId:    merchant.merchantId,
      amount,
      currency:      merchant.currency,
      status,
      cardLast4:     randItem(CARD_LAST4),
      cardBrand:     randItem(CARD_BRANDS),
      createdAt,
      updatedAt,
    };

    if (status === 'REFUNDED' || status === 'CHARGEBACK') {
      refundableTxnIds.push({ txnId, merchantId: merchant.merchantId, amount, currency: merchant.currency, createdAt });
    }

    batch.push(doc);
  }

  db.transactions.insertMany(batch, { ordered: false });
  inserted += batchCount;
  print(`  inserted ${inserted}/${TOTAL}`);
}

// ── Refunds (one per REFUNDED/CHARGEBACK transaction) ─────────────────────────
print(`→ Seeding ${refundableTxnIds.length} refunds…`);
db.refunds.deleteMany({});

const refundBatches = [];
for (let i = 0; i < refundableTxnIds.length; i += BATCH_SIZE) {
  refundBatches.push(refundableTxnIds.slice(i, i + BATCH_SIZE));
}

const REFUND_REASONS = [
  'Customer request',
  'Duplicate charge',
  'Product not received',
  'Product returned',
  'Fraudulent transaction',
  'Order cancelled',
];

for (const batch of refundBatches) {
  db.refunds.insertMany(
    batch.map(({ txnId, merchantId, amount, currency, createdAt }) => {
      const isPartial    = Math.random() < 0.3;
      const refundAmount = isPartial ? randInt(100, amount - 1) : amount;
      const refundedAt   = new Date(createdAt.getTime() + randInt(3_600_000, 7 * 86_400_000));

      return {
        refundId:       `ref_${uuid().replace(/-/g, '').slice(0, 20)}`,
        transactionId:  txnId,
        merchantId,
        amount:         refundAmount,
        currency,
        status:         randItem(['PROCESSED', 'PROCESSED', 'PROCESSED', 'PENDING', 'FAILED']),
        idempotencyKey: uuid(),
        reason:         randItem(REFUND_REASONS),
        createdAt:      refundedAt,
        updatedAt:      refundedAt,
      };
    }),
    { ordered: false }
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────
const counts = {};
for (const { status } of STATUS_WEIGHTS) {
  counts[status] = db.transactions.countDocuments({ status });
}

print('\n✓ Seed complete');
print(`  transactions : ${db.transactions.countDocuments()}`);
print(`  refunds      : ${db.refunds.countDocuments()}`);
print(`  merchants    : ${db.merchants.countDocuments()}`);
print(`  users        : ${db.users.countDocuments()}`);
print('\n  Status breakdown:');
for (const [status, count] of Object.entries(counts)) {
  print(`    ${status.padEnd(12)} ${count}`);
}
