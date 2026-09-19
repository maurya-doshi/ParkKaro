import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createDisputeSchema, updateDisputeSchema } from '../../validators/commit9Validators';
import {
  createDisputeHandler,
  getDisputeHandler,
  listDisputesHandler,
  updateDisputeHandler,
} from './handlers';

export const disputeRouter = Router();

// POST /disputes
disputeRouter.post('/', requireAuth, validate(createDisputeSchema, 'body'), createDisputeHandler);

// GET /disputes
disputeRouter.get('/', requireAuth, listDisputesHandler);

// GET /disputes/:id
disputeRouter.get('/:id', requireAuth, getDisputeHandler);

// PATCH /disputes/:id — admin status update
disputeRouter.patch('/:id', requireAuth, validate(updateDisputeSchema, 'body'), updateDisputeHandler);
