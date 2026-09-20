import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createReportSchema, updateReportStatusSchema } from '../../validators/commit9Validators';
import {
  createReportHandler,
  getReportHandler,
  listMyReportsHandler,
  listAllReportsHandler,
  updateReportStatusHandler,
} from './handlers';

export const reportRouter = Router();

// POST /reports
reportRouter.post('/', requireAuth, validate(createReportSchema, 'body'), createReportHandler);

// GET /reports (role-scoped: admin sees all, user sees own)
reportRouter.get('/', requireAuth, (req, res, next) => {
  if (req.user?.role === 'ADMIN') {
    return listAllReportsHandler(req, res, next);
  }
  return listMyReportsHandler(req, res, next);
});

// GET /reports/me
reportRouter.get('/me', requireAuth, listMyReportsHandler);

// GET /reports/all  — admin
reportRouter.get('/all', requireAuth, listAllReportsHandler);

// GET /reports/:id
reportRouter.get('/:id', requireAuth, getReportHandler);

// PATCH /reports/:id/status — admin
reportRouter.patch('/:id/status', requireAuth, validate(updateReportStatusSchema, 'body'), updateReportStatusHandler);
