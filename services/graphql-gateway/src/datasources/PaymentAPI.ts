import { GraphQLError } from 'graphql';
import type { Logger } from 'pino';

export interface TransactionRecord {
  id:         string;
  merchantId: string;
  amount:     number;
  currency:   string;
  status:     string;
  cardLast4:  string;
  cardBrand:  string;
  metadata:   Record<string, string>;
  createdAt:  string;
  updatedAt:  string;
}

export interface TransactionPage {
  data: TransactionRecord[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export class PaymentAPI {
  constructor(
    private readonly baseUrl: string,
    private readonly logger:  Logger,
    private readonly token:   string | null = null,
  ) {}

  private authHeaders(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  private async get<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
    const searchParams = new URLSearchParams();
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .forEach(([k, v]) => searchParams.append(k, String(v)));
    
    const qs = searchParams.toString();

    const url = `${this.baseUrl}${path}${qs ? `?${qs}` : ''}`;

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
        signal:  AbortSignal.timeout(8000),
      });
    } catch (err) {
      this.logger.error({ err, url }, 'PaymentAPI network error');
      throw new GraphQLError('Payment service unavailable', {
        extensions: { code: 'SERVICE_UNAVAILABLE', http: { status: 503 } },
      });
    }

    if (res.status === 404) return null as unknown as T;

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      this.logger.warn({ url, status: res.status }, 'PaymentAPI error');
      throw new GraphQLError(body.message ?? 'Payment service error', {
        extensions: { code: 'UPSTREAM_ERROR', http: { status: res.status } },
      });
    }

    return res.json() as Promise<T>;
  }

  async listTransactions(filter: Record<string, unknown>): Promise<TransactionPage> {
    return this.get<TransactionPage>('/v1/transactions', filter);
  }

  async getTransaction(id: string): Promise<TransactionRecord | null> {
    return this.get<TransactionRecord | null>(`/v1/transactions/${id}`);
  }
}
