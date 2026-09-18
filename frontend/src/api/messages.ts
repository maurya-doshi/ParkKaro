import { apiClient } from './client';
import { Conversation, ChatMessage } from '../types/message';
import { DEMO_CONVERSATIONS, DEMO_MESSAGES } from './mockData';

const MOCK_CONV_KEY = 'parkshare_demo_conversations';
const MOCK_MSG_KEY = 'parkshare_demo_messages';

function getStoredConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(MOCK_CONV_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading conversations', e);
  }
  return [...DEMO_CONVERSATIONS];
}

function getStoredMessages(): Record<string, ChatMessage[]> {
  try {
    const raw = localStorage.getItem(MOCK_MSG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading messages', e);
  }
  return { ...DEMO_MESSAGES };
}

export const messagesApi = {
  async getConversations(): Promise<Conversation[]> {
    try {
      const res = await apiClient.get<{ items: Conversation[] }>('/conversations');
      if (res.success && res.data?.items) return res.data.items;
    } catch {
      // Fallback
    }
    return getStoredConversations();
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const res = await apiClient.get<{ items: ChatMessage[] }>(`/conversations/${conversationId}/messages`);
      if (res.success && res.data?.items) return res.data.items;
    } catch {
      // Fallback
    }

    const map = getStoredMessages();
    return map[conversationId] || [];
  },

  async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    try {
      const res = await apiClient.post<ChatMessage>(`/conversations/${conversationId}/messages`, { content });
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }

    const map = getStoredMessages();
    const convs = getStoredConversations();

    const newMsg: ChatMessage = {
      messageId: `msg_${Date.now().toString(36)}`,
      conversationId,
      senderId: 'user_driver1',
      senderName: 'Arjun Verma',
      content,
      createdAt: new Date().toISOString()
    };

    const currentList = map[conversationId] || [];
    map[conversationId] = [...currentList, newMsg];
    localStorage.setItem(MOCK_MSG_KEY, JSON.stringify(map));

    const convIndex = convs.findIndex((c) => c.conversationId === conversationId);
    if (convIndex !== -1) {
      convs[convIndex].lastMessageAt = newMsg.createdAt;
      convs[convIndex].lastMessagePreview = content;
      localStorage.setItem(MOCK_CONV_KEY, JSON.stringify(convs));
    }

    return newMsg;
  }
};
