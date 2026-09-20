import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { messagesApi } from '../../api/messages';
import { Conversation, ChatMessage } from '../../types/message';
import { Send, MessageSquare, User, CheckCheck, Clock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    messagesApi.getConversations().then((list) => {
      setConversations(list);
      if (list.length > 0) {
        setActiveConvId(list[0].conversationId);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    messagesApi.getMessages(activeConvId).then((msgs) => {
      setMessages(msgs);
    });
  }, [activeConvId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeConvId) return;

    try {
      const sent = await messagesApi.sendMessage(activeConvId, inputContent.trim());
      setMessages((prev) => [...prev, sent]);
      setInputContent('');
    } catch {
      showToast('Failed to send message', 'error');
    }
  };

  const activeConv = conversations.find((c) => c.conversationId === activeConvId);

  const { user } = useAuth();
  const isHost = user?.role === 'HOST';

  return (
    <DashboardLayout
      type={isHost ? 'host' : 'driver'}
      title={isHost ? 'Guest Messages' : 'Host & Driver Chat'}
      subtitle={
        isHost
          ? 'Manage communication with guests regarding check-ins, extensions, or issues.'
          : 'Direct communication with parking hosts for gate directions, access instructions, or special requests.'
      }
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden h-[580px] flex flex-col md:flex-row">
        {/* Conversation Threads Sidebar */}
        <div className="w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Conversations ({conversations.length})
            </h3>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {conversations.map((c) => {
              const isSelected = c.conversationId === activeConvId;
              const otherName = c.participantNames?.['user_host1'] || 'Parking Host';

              return (
                <div
                  key={c.conversationId}
                  onClick={() => setActiveConvId(c.conversationId)}
                  className={`p-4 cursor-pointer transition flex items-start gap-3 ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                    alt={otherName}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">{otherName}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.lastMessageAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-blue-600 truncate mt-0.5">
                      {c.listingTitle}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{c.lastMessagePreview}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Thread Messages */}
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {activeConv.participantNames?.[activeConv.participants.find(p => p !== user?.userId) || ''] || (isHost ? 'Guest' : 'Host')}
                  </h4>
                  <p className="text-[11px] text-slate-500">{activeConv.listingTitle}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Online
                </span>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => {
                  const isMe = m.senderId === user?.userId;

                  return (
                    <div
                      key={m.messageId}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {isMe && <CheckCheck className="w-3 h-3 text-blue-600 inline" />}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message to host..."
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
