import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createConversationSchema, sendMessageSchema } from '../../validators/commit9Validators';
import {
  getOrCreateConversationHandler,
  listConversationsHandler,
  getConversationHandler,
  sendMessageHandler,
  getMessagesHandler,
} from './handlers';

export const messageRouter = Router();

// POST /conversations
messageRouter.post('/', requireAuth, validate(createConversationSchema, 'body'), getOrCreateConversationHandler);

// GET /conversations
messageRouter.get('/', requireAuth, listConversationsHandler);

// GET /conversations/:id
messageRouter.get('/:id', requireAuth, getConversationHandler);

// GET /conversations/:id/messages
messageRouter.get('/:id/messages', requireAuth, getMessagesHandler);

// POST /conversations/:id/messages
messageRouter.post('/:id/messages', requireAuth, validate(sendMessageSchema, 'body'), sendMessageHandler);
