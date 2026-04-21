import { Router, type Request, type Response, type NextFunction } from 'express';
import { getDb } from '../db.js';
import { CreateMerchantSchema, UpdateMerchantSchema, ListQuerySchema } from './merchant.schema.js';
import {
  listMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
} from './merchant.repository.js';

export const merchantRouter = Router();

// GET /v1/merchants
merchantRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(422).json({ message: parsed.error.issues[0].message });
      return;
    }
    res.json(await listMerchants(getDb(), parsed.data));
  } catch (err) { next(err); }
});

// GET /v1/merchants/:id
merchantRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchant = await getMerchantById(getDb(), req.params.id);
    if (!merchant) { res.status(404).json({ message: 'Merchant not found' }); return; }
    res.json(merchant);
  } catch (err) { next(err); }
});

// POST /v1/merchants
merchantRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateMerchantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ message: parsed.error.issues[0].message, issues: parsed.error.issues });
      return;
    }
    const merchant = await createMerchant(getDb(), parsed.data);
    res.status(201).json(merchant);
  } catch (err) { next(err); }
});

// PATCH /v1/merchants/:id
merchantRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = UpdateMerchantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ message: parsed.error.issues[0].message, issues: parsed.error.issues });
      return;
    }
    const merchant = await updateMerchant(getDb(), req.params.id, parsed.data);
    if (!merchant) { res.status(404).json({ message: 'Merchant not found' }); return; }
    res.json(merchant);
  } catch (err) { next(err); }
});

// DELETE /v1/merchants/:id
merchantRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await deleteMerchant(getDb(), req.params.id);
    if (!deleted) { res.status(404).json({ message: 'Merchant not found' }); return; }
    res.status(204).send();
  } catch (err) { next(err); }
});
