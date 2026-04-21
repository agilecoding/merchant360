import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import pino from 'pino';

const logger = pino({ level: 'silent' });

// ── store mock ─────────────────────────────────────────────────────────────────
vi.mock('../store.js', () => ({
  appendRecord:  vi.fn(),
  getRecords:    vi.fn(() => []),
  countRecords:  vi.fn(() => 0),
}));

import { sendEmail } from './email.service.js';
import { dispatchWebhook } from './webhook.service.js';

// ── fetch mock ─────────────────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('sendEmail', () => {
  it('returns a notification record with channel=email', async () => {
    // Use a fixed seed so random always succeeds
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const record = await sendEmail(
      { event: 'refund.created', to: 'user@example.com', subject: 'Refund', body: 'Your refund was issued.' },
      logger,
    );
    expect(record.channel).toBe('email');
    expect(record.event).toBe('refund.created');
    expect(record.recipient).toBe('user@example.com');
    expect(record.status).toBe('sent');
    expect(record.id).toBeTruthy();
  });

  it('marks as failed when mock random triggers failure', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.0);
    const record = await sendEmail(
      { event: 'refund.failed', to: 'user@example.com', subject: 'Fail', body: 'Something went wrong.' },
      logger,
    );
    expect(record.status).toBe('failed');
    expect(record.error).toBeTruthy();
  });
});

describe('dispatchWebhook', () => {
  it('marks as sent on 2xx response', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    const record = await dispatchWebhook(
      { event: 'transaction.captured', url: 'https://example.com/hook', data: { txId: 'txn_001' } },
      logger,
    );
    expect(record.channel).toBe('webhook');
    expect(record.status).toBe('sent');
    expect(record.recipient).toBe('https://example.com/hook');
  });

  it('marks as failed on non-2xx response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    const record = await dispatchWebhook(
      { event: 'refund.processed', url: 'https://example.com/hook', data: {} },
      logger,
    );
    expect(record.status).toBe('failed');
    expect(record.error).toBe('HTTP 500');
  });

  it('marks as failed on network error', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
    const record = await dispatchWebhook(
      { event: 'merchant.status_changed', url: 'https://bad.host/hook', data: {} },
      logger,
    );
    expect(record.status).toBe('failed');
    expect(record.error).toMatch(/ECONNREFUSED/);
  });

  it('adds signature header when secret provided', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    await dispatchWebhook(
      { event: 'refund.created', url: 'https://example.com/hook', data: {}, secret: 'mysecret' },
      logger,
    );
    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers  = callArgs[1].headers as Record<string, string>;
    expect(headers['x-webhook-signature']).toMatch(/^sha256=/);
  });
});
