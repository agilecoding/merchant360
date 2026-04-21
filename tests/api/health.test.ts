import { describe, it, expect } from 'vitest';

const SERVICES = [
  { name: 'payment-service', url: process.env.PAYMENT_SERVICE_URL ?? 'http://localhost:3001' },
  { name: 'refund-service', url: process.env.REFUND_SERVICE_URL ?? 'http://localhost:3002' },
  { name: 'merchant-service', url: process.env.MERCHANT_SERVICE_URL ?? 'http://localhost:3003' },
  { name: 'notification-service', url: process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3004' },
];

describe('Service health checks', () => {
  for (const svc of SERVICES) {
    it(`${svc.name} /health returns ok`, async () => {
      const res = await fetch(`${svc.url}/health`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
    });
  }
});
