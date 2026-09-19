import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../../services/notificationService';
import { sendSuccess } from '../../utils/response';

export async function listNotificationsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const result = await notificationService.listNotifications(req.user!.userId, limit);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getUnreadCountHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    sendSuccess(res, { unreadCount: count });
  } catch (err) { next(err); }
}

export async function markAsReadHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markAsRead(req.user!.userId, req.params.id);
    sendSuccess(res, { message: 'Notification marked as read' });
  } catch (err) { next(err); }
}

export async function markAllAsReadHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markAllAsRead(req.user!.userId);
    sendSuccess(res, { message: 'All notifications marked as read' });
  } catch (err) { next(err); }
}
