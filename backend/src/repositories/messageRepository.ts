import { BaseRepository } from './baseRepository';
import { Message } from '../models/Message';

export class MessageRepository extends BaseRepository<Message> {
  constructor() {
    super('messages');
  }

  async create(message: Message): Promise<Message> {
    return this.putItem(message);
  }

  async findByConversationId(conversationId: string, limit = 100): Promise<Message[]> {
    return this.queryItems({
      KeyConditionExpression: 'conversationId = :conversationId',
      ExpressionAttributeValues: {
        ':conversationId': conversationId,
      },
      ScanIndexForward: true, // chronological order
      Limit: limit,
    });
  }
}

export const messageRepository = new MessageRepository();
