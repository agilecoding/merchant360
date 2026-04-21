/**
 * In-memory notification log (dev/mock only).
 * In production this would be a MongoDB collection or message queue.
 */
import type { NotificationRecord } from './types.js';

const MAX_RECORDS = 1000;

const records: NotificationRecord[] = [];

export function appendRecord(record: NotificationRecord): void {
  if (records.length >= MAX_RECORDS) records.shift();
  records.push(record);
}

export function getRecords(limit = 50, offset = 0): NotificationRecord[] {
  return records.slice().reverse().slice(offset, offset + limit);
}

export function countRecords(): number {
  return records.length;
}
