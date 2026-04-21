import { randomUUID, createHmac } from 'node:crypto';
import type { Logger } from 'pino';
import { config } from '../config.js';
import type { SendWebhookInput } from './webhook.schema.js';
import type { NotificationRecord } from '../types.js';
import { appendRecord } from '../store.js';

const WEBHOOK_TIMEOUT_MS = config.WEBHOOK_TIMEOUT_MS;

function signPayload(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

/**
 * Mock webhook dispatcher.
 * Actually attempts the outbound HTTP call in dev; records result either way.
 * In production: replace with a queued retry strategy (BullMQ / SQS).
 */
export async function dispatchWebhook(
  input: SendWebhookInput,
  logger: Logger,
): Promise<NotificationRecord> {
  const id        = randomUUID();
  const now       = new Date().toISOString();
  const body      = JSON.stringify({ event: input.event, data: input.data, timestamp: now, id });
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-notification-id': id };

  if (input.secret) {
    headers['x-webhook-signature'] = signPayload(body, input.secret);
  }

  let status:  NotificationRecord['status'] = 'failed';
  let error:   string | undefined;
  let sentAt:  string | undefined;

  try {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    const res = await fetch(input.url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (res.ok) {
      status = 'sent';
      sentAt = new Date().toISOString();
      logger.info({ id, event: input.event, url: input.url, httpStatus: res.status }, 'Webhook delivered');
    } else {
      error = `HTTP ${res.status}`;
      logger.warn({ id, event: input.event, url: input.url, httpStatus: res.status }, 'Webhook non-2xx');
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    logger.warn({ id, event: input.event, url: input.url, error }, 'Webhook dispatch error');
  }

  const record: NotificationRecord = {
    id,
    channel:   'webhook',
    event:     input.event,
    recipient: input.url,
    status,
    attempts:  1,
    error,
    sentAt,
    createdAt: now,
  };

  appendRecord(record);
  return record;
}
