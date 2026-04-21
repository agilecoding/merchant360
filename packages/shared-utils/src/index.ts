import { randomUUID } from 'crypto';

/** Generate a request ID for tracing */
export function generateRequestId(): string {
  return randomUUID();
}

/** Mask card number — return last 4 digits only */
export function maskCardNumber(pan: string): string {
  return `****-****-****-${pan.slice(-4)}`;
}

/** Format amount from cents to display string */
export function formatAmount(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amountCents / 100);
}

/** Build structured API error */
export function buildApiError(
  code: string,
  message: string,
  statusCode: number,
  requestId: string,
) {
  return { code, message, statusCode, requestId };
}

/** Sleep utility for retry back-off */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry with exponential back-off */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 200,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (++attempt >= retries) throw err;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
}
