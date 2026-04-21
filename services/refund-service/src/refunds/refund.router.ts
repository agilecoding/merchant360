import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { CreateRefundSchema } from './refund.schema.js';
import { createRefund } from './refund.service.js';
import { listRefunds } from './refund.repository.js';

export const refundRouter = Router();

const ListQuerySchema = z.object({
  transactionId: z.string().optional(),
  merchantId:    z.string().optional(),
  status:        z.enum(['PENDING', 'PROCESSED', 'FAILED', 'CANCELLED']).optional(),
  page:          z.coerce.number().int().min(1).default(1),
  pageSize:      z.coerce.number().int().min(1).max(200).default(20),
});

// GET /v1/refunds
refundRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(422).json({ message: parsed.error.issues[0].message });
      return;
    }
    res.json(await listRefunds(getDb(), parsed.data));
  } catch (err) { next(err); }
});

// POST /v1/refunds
refundRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idempotencyKey = req.headers['x-idempotency-key'];
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      res.status(400).json({ message: 'x-idempotency-key header is required' });
      return;
    }

    const parsed = CreateRefundSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ message: parsed.error.issues[0].message, issues: parsed.error.issues });
      return;
    }

    const result = await createRefund(getDb(), parsed.data, idempotencyKey);

    if (!result.ok) {
      res.status(result.status).json({ message: result.message });
      return;
    }

    res.status(201).json(result.refund);
  } catch (err) { next(err); }
});
