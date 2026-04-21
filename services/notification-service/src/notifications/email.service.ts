import { randomUUID } from 'node:crypto';
import type { Logger } from 'pino';
import type { SendEmailInput } from './email.schema.js';
import type { NotificationRecord } from '../types.js';
import { appendRecord } from '../store.js';

/**
 * Mock email sender.
 * Logs the email and records it in the in-memory store.
 * In production: swap for nodemailer / SendGrid / SES SDK call.
 */
export async function sendEmail(
  input: SendEmailInput,
  logger: Logger,
): Promise<NotificationRecord> {
  const id  = randomUUID();
  const now = new Date().toISOString();

  // Simulate ~95% delivery success
  const success = Math.random() > 0.05;

  const record: NotificationRecord = {
    id,
    channel:   'email',
    event:     input.event,
    recipient: input.to,
    status:    success ? 'sent' : 'failed',
    attempts:  1,
    error:     success ? undefined : 'SMTP connection timeout (mock)',
    sentAt:    success ? now : undefined,
    createdAt: now,
  };

  appendRecord(record);

  if (success) {
    logger.info({ id, event: input.event, to: input.to }, 'Email sent (mock)');
  } else {
    logger.warn({ id, event: input.event, to: input.to }, 'Email failed (mock)');
  }

  return record;
}
