import { GraphQLError } from 'graphql';
import type { Logger } from 'pino';

export interface RefundRecord {
  id:             string;
  transactionId:  string;
  merchantId:     string;
  amount:         number;
  currency:       string;
  status:         string;
  idempotencyKey: string;
  reason?:        string;
  createdAt:      string;
  updatedAt:      string;
}

export interface CreateRefundPayload {
  transactionId:  string;
  amount:         number;
  currency:       string;
  reason?:        string;
  idempotencyKey: string;
}

export class RefundAPI {
  constructor(
    private readonly baseUrl: string,
    private readonly logger:  Logger,
    private readonly token:   string | null = null,
  ) {}

  private authHeaders(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async createRefund(payload: CreateRefundPayload): Promise<RefundRecord> {
    const url = `${this.baseUrl}/v1/refunds`;

    let res: Response;
    try {
      res = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-idempotency-key': payload.idempotencyKey,
          ...this.authHeaders(),
        },
        body:   JSON.stringify({
          transactionId: payload.transactionId,
          amount:        payload.amount,
          currency:      payload.currency,
          reason:        payload.reason,
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      this.logger.error({ err, url }, 'RefundAPI network error');
      throw new GraphQLError('Refund service unavailable', {
        extensions: { code: 'SERVICE_UNAVAILABLE', http: { status: 503 } },
      });
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      this.logger.warn({ url, status: res.status, message: body.message }, 'RefundAPI error');

      const code = res.status === 422 ? 'VALIDATION_ERROR'
                 : res.status === 404 ? 'NOT_FOUND'
                 : 'UPSTREAM_ERROR';

      throw new GraphQLError(body.message ?? 'Refund service error', {
        extensions: { code, http: { status: res.status } },
      });
    }

    return res.json() as Promise<RefundRecord>;
  }

  async listRefundsByTransaction(transactionId: string): Promise<RefundRecord[]> {
    const url = `${this.baseUrl}/v1/refunds?transactionId=${encodeURIComponent(transactionId)}&pageSize=50`;

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
        signal:  AbortSignal.timeout(8000),
      });
    } catch (err) {
      this.logger.warn({ err, url }, 'RefundAPI list network error — returning empty');
      return [];
    }

    if (!res.ok) return [];

    const body = await res.json() as { data?: RefundRecord[] } | RefundRecord[];
    return Array.isArray(body) ? body : (body.data ?? []);
  }
}
