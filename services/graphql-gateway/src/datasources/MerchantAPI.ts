import { GraphQLError } from 'graphql';
import type { Logger } from 'pino';

export interface MerchantRecord {
  id:        string;
  name:      string;
  email:     string;
  status:    string;
  country:   string;
  currency:  string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantPage {
  data: MerchantRecord[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export class MerchantAPI {
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
      this.logger.error({ err, url }, 'MerchantAPI network error');
      throw new GraphQLError('Merchant service unavailable', {
        extensions: { code: 'SERVICE_UNAVAILABLE', http: { status: 503 } },
      });
    }

    if (res.status === 404) return null as unknown as T;

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      this.logger.warn({ url, status: res.status }, 'MerchantAPI error');
      throw new GraphQLError(body.message ?? 'Merchant service error', {
        extensions: { code: 'UPSTREAM_ERROR', http: { status: res.status } },
      });
    }

    return res.json() as Promise<T>;
  }

  async listMerchants(filter: Record<string, unknown>): Promise<MerchantPage> {
    return this.get<MerchantPage>('/v1/merchants', filter);
  }

  async getMerchant(id: string): Promise<MerchantRecord | null> {
    return this.get<MerchantRecord | null>(`/v1/merchants/${id}`);
  }
}
