import { BaseRepository } from './baseRepository';
import { Conversation } from '../models/Conversation';

export class ConversationRepository extends BaseRepository<Conversation> {
  constructor() {
    super('conversations');
  }

  async create(conversation: Conversation): Promise<Conversation> {
    return this.putItem(conversation);
  }

  async findById(conversationId: string): Promise<Conversation | null> {
    return this.getItem({ conversationId });
  }

  async findByUser(userId: string): Promise<Conversation[]> {
    // Check both participant indexes
    const [asP1, asP2] = await Promise.all([
      this.queryItems({
        IndexName: 'participant1-index',
        KeyConditionExpression: 'participant1 = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false,
      }),
      this.queryItems({
        IndexName: 'participant2-index',
        KeyConditionExpression: 'participant2 = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false,
      }),
    ]);

    const combined = [...asP1, ...asP2];
    combined.sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || ''));
    return combined;
  }

  async updateLastMessage(
    conversationId: string,
    preview: string,
    timestamp: string
  ): Promise<void> {
    await this.updateItem(
      { conversationId },
      'SET #lastMessagePreview = :preview, #lastMessageAt = :timestamp',
      {
        '#lastMessagePreview': 'lastMessagePreview',
        '#lastMessageAt': 'lastMessageAt',
      },
      {
        ':preview': preview,
        ':timestamp': timestamp,
      }
    );
  }
}

export const conversationRepository = new ConversationRepository();
