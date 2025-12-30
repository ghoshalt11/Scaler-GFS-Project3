import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  User, 
  Loader2, 
  Globe, 
  ShieldCheck,
  Zap,
  Download
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { marked } from "marked";
import { exportChatToPDF } from '../services/pdfService';
import { BotIcon } from '../App';

interface Message {
  role: 'user' | 'bot';
  text: string;
  sources?: { title: string; uri: string }[];
}

interface AnalyticalBotProps {
  isOpen: boolean;
  onClose: () => void;
  hotelContext: string;
  hasData: boolean; // New prop to track if data is uploaded
}

export const AnalyticalBot: React.FC<AnalyticalBotProps> = ({ isOpen, onClose, hotelContext, hasData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize or reset greeting based on data presence
  useEffect(() => {
    if (hasData) {
      setMessages([
        { 
          role: 'bot', 
          text: "Hello! I am your AI Business Strategist. I have analyzed your property's current data and I'm ready to perform what-if analyses, competitor benchmarks, or market trend evaluations. What's on your mind today?" 
        }
      ]);
    } else {
      setMessages([
        { 
          role: 'bot', 
          text: "Welcome to ProfitPath AI. Iam your Assistant business strategist. I generally help making strategic action planning to optimize" 
        }
      ]);
    }
  }, [hasData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const detectIntentRequiresSearch = (query: string): boolean => {
    const searchKeywords = [
      'market', 'competitor', 'news', 'trend', 'rate', 'price', 'weekend', 'local', 
      'festival', 'event', 'nearby', 'outside', 'industry', 'benchmark', 'weather'
    ];
    const lowercaseQuery = query.toLowerCase();
    return searchKeywords.some(keyword => lowercaseQuery.includes(keyword));
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    // Block logic if no data is uploaded
    if (!hasData) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          text: "You need to upload your sales / ledger data first. I need your business sales data for contextual grounding for making strategic planning, suggestions, analysis etc." 
        }]);
      }, 500);
      return;
    }

    setIsTyping(true);

    try {
      const needsSearch = detectIntentRequiresSearch(userMessage);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const config: any = {
        systemInstruction: `
          IDENTITY: You are a World-class Hospitality Business Strategist and Revenue Engine.
          
          GROUNDING RULES:
          1. INTERNAL DATA QUERY (EXCLUSIVELY SALES DATA): If the user's intent is to query their existing uploaded sales data (e.g., "What was the occupancy on X date?", "How many rooms were available?", "Show me the headers in my file"), strictly focus your answer on the provided HOTEL CONTEXT:
             ${hotelContext}
             Use the 'Parsed File Headers' to identify which internal fields map to their request (e.g., 'Inventory' means total available, 'Occupied' means booked).
          
          2. STRATEGIC / FUTURE / MARKET ANALYSIS: If the user asks for analysis, future strategy, or competitive benchmarking:
             a. Primary Grounding: Use the INTERNAL DATA provided above as the baseline.
             b. Secondary Grounding: Use Google Search to find REAL-TIME market trends, competitive pricing in the city, consumer demand patterns, and expected new hospitality services.
             c. Integration: Synthesize both internal and external data to provide a comprehensive yield-focused recommendation.
          
          3. STYLE: Data-driven, professional, and authoritative. Use Markdown tables for performance breakdowns.
        `
      };

      if (needsSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }]
          }
        ],
        config
      });

      const botText = response.text || "I'm sorry, I couldn't analyze that specific scenario. Could you rephrase your query?";
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || 'Source',
        uri: chunk.web?.uri || '#'
      }))?.filter((src: any) => src.uri !== '#').slice(0, 3);

      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: botText,
        sources: sources && sources.length > 0 ? sources : undefined
      }]);
    } catch (error) {
      console.error("Bot Error:", error);
      setMessages(prev => [...prev, { role: 'bot', text: "I encountered an error connecting to my analytical engine. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDownloadChat = () => {
    if (messages.length === 0) return;
    exportChatToPDF(messages);
  };

  const renderMessageContent = (text: string) => {
    const html = marked.parse(text);
    return { __html: html };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md relative">
              <BotIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">AI Business Strategist</h2>
              <p className="text-[10px] text-indigo-100 flex items-center gap-1 uppercase font-black tracking-widest mt-0.5">
                <ShieldCheck className="w-3 h-3" />
                {hasData ? "Grounding Active" : "WAITING FOR DATA"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadChat}
              title="Save Chat as PDF"
              className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 text-xs font-semibold"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Save Chat (PDF)</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
        >
          {messages.map((m, i) => (
            <div 
              key={i} 
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[95%] ${m.role === 'user' ? 'flex-row-reverse ml-auto' : 'flex-row'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative ${
                  m.role === 'user' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-indigo-900 shadow-sm'
                }`}>
                  {m.role === 'user' ? <User className="w-5 h-5" /> : (
                    <BotIcon className="w-8 h-8 text-indigo-900" />
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm prose-chat overflow-hidden ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}
                  dangerouslySetInnerHTML={m.role === 'bot' ? renderMessageContent(m.text) : undefined}
                  >
                    {m.role === 'user' ? m.text : null}
                  </div>
                  
                  {m.sources && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {m.sources.map((src, si) => (
                        <a 
                          key={si}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-medium text-slate-500 rounded-md transition-colors"
                        >
                          <Globe className="w-3 h-3" />
                          {src.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-100 text-sm italic text-slate-400 animate-pulse font-medium">
                  Synthesizing strategy...
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-2 border-t border-slate-100 bg-white flex gap-2 overflow-x-auto no-scrollbar">
           <button 
            onClick={() => setInput("What are the current average weekend rates for 4-star hotels in this area?")}
            className="whitespace-nowrap px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-tight hover:border-indigo-400 hover:text-indigo-600 transition-all bg-slate-50"
           >
            Rate benchmark
           </button>
           <button 
            onClick={() => setInput("Identify top 3 local events next month affecting hotel demand")}
            className="whitespace-nowrap px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-tight hover:border-indigo-400 hover:text-indigo-600 transition-all bg-slate-50"
           >
            Demand forecast
           </button>
           <button 
            onClick={() => setInput("Explain the profit flow-through logic for my current direct booking mix")}
            className="whitespace-nowrap px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-tight hover:border-indigo-400 hover:text-indigo-600 transition-all bg-slate-50"
           >
            Internal analysis
           </button>
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <div className="space-y-4">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={hasData ? "Query strategist engine..." : "Please upload your data first..."}
              className={`w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium ${!hasData ? 'cursor-not-allowed opacity-70' : ''}`}
            />
            <div className="flex justify-end">
              <button 
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className="p-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
