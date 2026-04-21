import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Logger } from 'pino';
import { SendEmailSchema } from './email.schema.js';
import { SendWebhookSchema } from './webhook.schema.js';
import { sendEmail } from './email.service.js';
import { dispatchWebhook } from './webhook.service.js';
import { getRecords, countRecords } from '../store.js';

export function notificationsRouter(logger: Logger): Router {
  const router = Router();

  // POST /v1/notifications/email
  router.post('/email', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = SendEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({ message: parsed.error.issues[0].message, issues: parsed.error.issues });
        return;
      }
      const record = await sendEmail(parsed.data, logger);
      res.status(record.status === 'sent' ? 200 : 502).json(record);
    } catch (err) { next(err); }
  });

  // POST /v1/notifications/webhook
  router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = SendWebhookSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({ message: parsed.error.issues[0].message, issues: parsed.error.issues });
        return;
      }
      const record = await dispatchWebhook(parsed.data, logger);
      res.status(record.status === 'sent' ? 200 : 502).json(record);
    } catch (err) { next(err); }
  });

  // GET /v1/notifications — audit log
  router.get('/', (req: Request, res: Response) => {
    const limit  = Math.min(Number(req.query.limit  ?? 50), 200);
    const offset = Number(req.query.offset ?? 0);
    res.json({
      data:  getRecords(limit, offset),
      meta:  { total: countRecords(), limit, offset },
    });
  });

  return router;
}
