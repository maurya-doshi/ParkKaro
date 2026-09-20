import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createPaymentSchema, processPaymentSchema } from '../../validators/paymentValidator';
import {
  createPaymentHandler,
  getPaymentHandler,
  processPaymentHandler,
} from './handlers';

export const paymentRouter = Router();

// POST /payments & POST /payments/create
paymentRouter.post('/', requireAuth, validate(createPaymentSchema, 'body'), createPaymentHandler);
paymentRouter.post('/create', requireAuth, validate(createPaymentSchema, 'body'), createPaymentHandler);

// GET /payments/:id
paymentRouter.get('/:id', requireAuth, getPaymentHandler);

// POST /payments/:id/process & POST /payments/:id/confirm
paymentRouter.post(
  '/:id/process',
  requireAuth,
  validate(processPaymentSchema, 'body'),
  processPaymentHandler
);
paymentRouter.post(
  '/:id/confirm',
  requireAuth,
  validate(processPaymentSchema, 'body'),
  processPaymentHandler
);
