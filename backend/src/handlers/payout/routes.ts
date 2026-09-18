import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createPayoutSchema } from '../../validators/payoutValidator';
import { createPayoutHandler, listPayoutsHandler } from './handlers';

export const payoutRouter = Router();

// POST /host/payouts — Request a payout
payoutRouter.post('/payouts', requireAuth, validate(createPayoutSchema, 'body'), createPayoutHandler);

// GET /host/payouts — List host payouts
payoutRouter.get('/payouts', requireAuth, listPayoutsHandler);
