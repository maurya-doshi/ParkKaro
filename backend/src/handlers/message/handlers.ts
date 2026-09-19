import { Request, Response, NextFunction } from 'express';
import { messagingService } from '../../services/messagingService';
import { sendSuccess, sendCreated } from '../../utils/response';

export async function getOrCreateConversationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversation = await messagingService.getOrCreateConversation(
      req.user!.userId,
      req.body.otherUserId,
      req.body.listingId,
      req.body.bookingId
    );
    sendCreated(res, conversation);
  } catch (err) { next(err); }
}

export async function listConversationsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await messagingService.listConversations(req.user!.userId);
    sendSuccess(res, { items });
  } catch (err) { next(err); }
}

export async function getConversationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversation = await messagingService.getConversation(req.params.id, req.user!.userId);
    sendSuccess(res, conversation);
  } catch (err) { next(err); }
}

export async function sendMessageHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const message = await messagingService.sendMessage(
      req.params.id,
      req.user!.userId,
      req.body.content
    );
    sendCreated(res, message);
  } catch (err) { next(err); }
}

export async function getMessagesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const messages = await messagingService.getMessages(req.params.id, req.user!.userId, limit);
    sendSuccess(res, { items: messages });
  } catch (err) { next(err); }
}
