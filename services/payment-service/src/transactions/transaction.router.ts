import { Router, type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';
import { getDb } from '../db.js';
import { ListQuerySchema } from './transaction.schema.js';
import { findTransactions, findTransactionById } from './transaction.repository.js';

export const transactionRouter = Router();

// GET /v1/transactions
transactionRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(422).json({ message: parsed.error.issues[0].message, issues: parsed.error.issues });
      return;
    }
    const result = await findTransactions(getDb(), parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /v1/transactions/:id
transactionRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tx = await findTransactionById(getDb(), req.params.id);
    if (!tx) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }
    res.json(tx);
  } catch (err) {
    next(err);
  }
});
