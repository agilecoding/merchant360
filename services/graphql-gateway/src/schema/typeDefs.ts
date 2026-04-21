export const typeDefs = /* GraphQL */ `
  scalar DateTime

  # ── Enums ─────────────────────────────────────────────────────────────────────

  enum TransactionStatus {
    AUTHORIZED
    CAPTURED
    FAILED
    PENDING
    REFUNDED
    CHARGEBACK
    CANCELLED
  }

  enum MerchantStatus {
    ACTIVE
    INACTIVE
    SUSPENDED
  }

  enum RefundStatus {
    PENDING
    PROCESSED
    FAILED
    CANCELLED
  }

  # ── Types ─────────────────────────────────────────────────────────────────────

  type Transaction {
    id:         String!
    merchantId: String!
    amount:     Int!
    currency:   String!
    status:     TransactionStatus!
    cardLast4:  String!
    cardBrand:  String!
    metadata:   [KeyValue!]!
    createdAt:  DateTime!
    updatedAt:  DateTime!
    merchant:   Merchant
    refunds:    [Refund!]!
  }

  type Merchant {
    id:        String!
    name:      String!
    email:     String!
    status:    MerchantStatus!
    country:   String!
    currency:  String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Refund {
    id:             String!
    transactionId:  String!
    merchantId:     String!
    amount:         Int!
    currency:       String!
    status:         RefundStatus!
    idempotencyKey: String!
    reason:         String
    createdAt:      DateTime!
    updatedAt:      DateTime!
  }

  type KeyValue {
    key:   String!
    value: String!
  }

  # ── Pagination ────────────────────────────────────────────────────────────────

  type TransactionPage {
    data:       [Transaction!]!
    total:      Int!
    page:       Int!
    pageSize:   Int!
    totalPages: Int!
  }

  type MerchantPage {
    data:       [Merchant!]!
    total:      Int!
    page:       Int!
    pageSize:   Int!
    totalPages: Int!
  }

  # ── Inputs ────────────────────────────────────────────────────────────────────

  input TransactionsFilter {
    merchantId: String
    status:     TransactionStatus
    from:       DateTime
    to:         DateTime
    page:       Int
    pageSize:   Int
    sort:       String
    order:      String
  }

  input MerchantsFilter {
    status:   MerchantStatus
    country:  String
    page:     Int
    pageSize: Int
  }

  input RefundTransactionInput {
    transactionId:  String!
    amount:         Int!
    currency:       String!
    reason:         String
    idempotencyKey: String!
  }

  # ── Root ──────────────────────────────────────────────────────────────────────

  type Query {
    transactions(filter: TransactionsFilter): TransactionPage!
    transaction(id: String!): Transaction
    merchants(filter: MerchantsFilter): MerchantPage!
    merchant(id: String!): Merchant
  }

  type Mutation {
    refundTransaction(input: RefundTransactionInput!): Refund!
  }
`;
