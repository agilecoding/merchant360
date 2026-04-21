# API Specification

All services expose JSON REST APIs over HTTP. Prefix: `/v1`.

## Common Headers

| Header | Required | Description |
|---|---|---|
| `Authorization` | Yes | `Bearer <jwt>` |
| `x-request-id` | No | Client-supplied trace ID (generated if absent) |
| `x-idempotency-key` | Refunds only | UUID v4 |

## Common Error Shape

```json
{
  "code": "VALIDATION_ERROR",
  "message": "amount must be positive",
  "statusCode": 422,
  "requestId": "req_abc123"
}
```

---

## payment-service  :3001

### GET /v1/transactions
Returns paginated list of transactions.

Query params: `page`, `pageSize`, `status`, `merchantId`, `from`, `to`

### GET /v1/transactions/:id
Single transaction by ID. Card number masked.

### POST /v1/transactions
Create (authorize) a new transaction.

```json
{ "merchantId": "...", "amount": 1000, "currency": "USD", "cardToken": "tok_..." }
```

---

## refund-service  :3002

### POST /v1/refunds
Issue a refund. Requires `x-idempotency-key`.

```json
{ "transactionId": "...", "amount": 500, "currency": "USD", "reason": "Customer request" }
```

### GET /v1/refunds/:id
Refund status by ID.

---

## merchant-service  :3003

### GET /v1/merchants
List all merchants (admin only).

### GET /v1/merchants/:id
Merchant detail.

### PATCH /v1/merchants/:id
Update merchant status.

---

## notification-service  :3004

### POST /v1/notifications
Internal endpoint — emit an event notification.

### GET /health
Liveness check.

---

## graphql-gateway  :4000

Single `/graphql` endpoint. Federated schema across all subgraphs.

Key queries:
- `transactions(page, pageSize, filters)` → `PaginatedTransactions`
- `transaction(id)` → `Transaction`
- `refunds(transactionId)` → `[Refund]`
- `merchants` → `[Merchant]`

Key mutations:
- `issueRefund(input)` → `Refund`
- `updateMerchantStatus(id, status)` → `Merchant`
