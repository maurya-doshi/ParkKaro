import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { aiApi } from '../../api/ai';
import { ParkingListing } from '../../types/parking';
import {
  X,
  Sparkles,
  Send,
  MapPin,
  Star,
  ChevronRight,
  Loader2,
  Bot,
  User as UserIcon,
  Zap
} from 'lucide-react';

interface AIAssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  listings?: ParkingListing[];
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'EV charging spots in Indiranagar',
  'Covered parking under ₹50/hr',
  'Nearest spot to Koramangala 5th block',
  'Budget parking near Whitefield ITPL',
];

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ open, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm ParkKaro AI, powered by Amazon Bedrock. Ask me anything about parking in Bengaluru — locations, pricing, EV chargers, or specific neighbourhoods.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiApi.searchWithAssistant({ query: text.trim() });
      const aiMsg: Message = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: res.explanation || 'Here are some parking spots that match your query:',
        listings: res.listings?.slice(0, 3),
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: 'Sorry, I had trouble fetching results. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-white shadow-2xl border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm">ParkKaro AI Assistant</h2>
            <p className="text-[11px] text-blue-100">Powered by Amazon Bedrock</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition"
            aria-label="Close AI panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                  : 'bg-slate-700'
              }`}>
                {msg.role === 'assistant' ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5" />
                )}
              </div>

              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>

                {/* Listing Cards in response */}
                {msg.listings && msg.listings.length > 0 && (
                  <div className="space-y-2 w-full">
                    {msg.listings.map((listing) => (
                      <Link
                        key={listing.listingId}
                        to={`/parking/${listing.listingId}`}
                        onClick={onClose}
                        className="block bg-white border border-slate-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-md transition group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                              {listing.title}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5 text-slate-500">
                              <MapPin className="w-3 h-3" />
                              <span className="text-[11px] truncate">{listing.area}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex items-center gap-0.5 text-amber-500">
                                <Star className="w-3 h-3 fill-current" />
                                <span className="text-[11px] font-semibold">{listing.rating}</span>
                              </div>
                              <span className="text-[11px] text-slate-400">•</span>
                              <span className="text-[11px] font-bold text-blue-600">
                                ₹{listing.pricePerHour}/hr
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 mt-1 transition" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-slate-400 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Quick searches
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-semibold hover:bg-blue-100 transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="px-4 pb-5 pt-3 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about EV spots, pricing, areas..."
              className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
