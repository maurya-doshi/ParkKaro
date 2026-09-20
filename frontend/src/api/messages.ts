import { apiClient } from './client';
import { Conversation, ChatMessage } from '../types/message';

export const messagesApi = {
  /**
   * List user's conversations
   * GET /conversations
   */
  async getConversations(): Promise<Conversation[]> {
    const res = await apiClient.get<{ items: Conversation[] }>('/conversations');
    if (res && res.data) {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data)) return res.data as any;
    }
    return [];
  },

  /**
   * List messages in a conversation
   * GET /conversations/{id}/messages
   */
  async getMessages(conversationId: string, params?: { limit?: number; nextToken?: string }): Promise<ChatMessage[]> {
    const res = await apiClient.get<{ items: ChatMessage[] }>(`/conversations/${conversationId}/messages`, params);
    if (res && res.data) {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data)) return res.data as any;
    }
    return [];
  },

  /**
   * Send a message in a conversation
   * POST /conversations/{id}/messages
   */
  async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    const res = await apiClient.post<ChatMessage>(`/conversations/${conversationId}/messages`, { content });
    if (res && res.data) {
      return res.data;
    }
    throw new Error('Failed to send message');
  }
};
