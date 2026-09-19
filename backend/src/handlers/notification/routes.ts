import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import {
  listNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler,
} from './handlers';

export const notificationRouter = Router();

// GET /notifications
notificationRouter.get('/', requireAuth, listNotificationsHandler);

// GET /notifications/unread-count
notificationRouter.get('/unread-count', requireAuth, getUnreadCountHandler);

// PATCH /notifications/read-all
notificationRouter.patch('/read-all', requireAuth, markAllAsReadHandler);

// PATCH & POST /notifications/:id/read
notificationRouter.patch('/:id/read', requireAuth, markAsReadHandler);
notificationRouter.post('/:id/read', requireAuth, markAsReadHandler);
