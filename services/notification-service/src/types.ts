export type NotificationChannel = 'email' | 'webhook';
export type NotificationStatus  = 'queued' | 'sent' | 'failed';
export type NotificationEvent   =
  | 'refund.created'
  | 'refund.processed'
  | 'refund.failed'
  | 'transaction.captured'
  | 'transaction.chargeback'
  | 'merchant.status_changed';

export interface EmailPayload {
  to:      string;
  subject: string;
  body:    string;
}

export interface WebhookPayload {
  url:     string;
  event:   NotificationEvent;
  data:    Record<string, unknown>;
  secret?: string;
}

export interface NotificationRecord {
  id:        string;
  channel:   NotificationChannel;
  event:     NotificationEvent;
  recipient: string;   // email address or webhook URL
  status:    NotificationStatus;
  attempts:  number;
  error?:    string;
  sentAt?:   string;
  createdAt: string;
}
