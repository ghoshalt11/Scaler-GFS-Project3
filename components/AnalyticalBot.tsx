
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  TrendingUp, 
  Globe, 
  ShieldCheck,
  Zap,
  Download
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { marked } from "marked";
import { exportChatToPDF } from '../services/pdfService';

interface Message {
  role: 'user' | 'bot';
  text: string;
  sources?: { title: string; uri: string }[];
}

interface AnalyticalBotProps {
  isOpen: boolean;
  onClose: () => void;
  hotelContext: string;
}

export const AnalyticalBot: React.FC<AnalyticalBotProps> = ({ isOpen, onClose, hotelContext }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'bot', 
      text: "Hello! I am your AI Business Strategist. I have analyzed your property's current data and I'm ready to perform what-if analyses, competitor benchmarks, or market trend evaluations. What's on your mind today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          {
            role: 'user',
            parts: [{ text: `
              CONTEXT: You are a World-class Hospitality Business Strategist and Revenue Engine.
              HOTEL DATA: ${hotelContext}
              USER QUERY: ${userMessage}
              
              INSTRUCTIONS: 
              1. **Search Mandate**: For any query involving competitor pricing, local events, market trends, or current news, you MUST use the googleSearch tool to retrieve real-time data.
              2. **Real-Time Integration**: If you find specific market data (e.g., a local festival dates or competitor ADR), integrate those figures directly into your "What-If" calculations for the user's specific property.
              3. **Format Requirements**: Always provide a highly structured response using Markdown. 
              4. **Tables**: Use Markdown tables for P&L transformations, competitive benchmarks, or multi-scenario projections.
              5. **Analysis Focus**: Focus on ROI, Yield Management, and Flow-through (Profit Margin). 
              6. **Sections**: Use clear headers (###) like "Market Reality (Real-Time Data)", "Strategic Projection", and "Tactical Roadmap".
              7. **Conciseness**: Use bullet points. Be data-heavy and professionally direct.
              8. **Citations**: If you found data via search, acknowledge it and reference the findings clearly.
            ` }]
          }
        ],
        config: {
          tools: [{ googleSearch: {} }]
        }
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
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI Business Strategist</h2>
              <p className="text-xs text-indigo-100 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Live Market Analysis Active
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
              <span className="hidden sm:inline">Save</span>
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
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-indigo-600'
                }`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
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
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-100 text-sm italic text-slate-400 animate-pulse">
                  Accessing live market indices and transaction data...
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-2 border-t border-slate-100 bg-white flex gap-2 overflow-x-auto no-scrollbar">
           <button 
            onClick={() => setInput("Simulate 20% budget shift to Meta-search during local music festival")}
            className="whitespace-nowrap px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all"
           >
            Festival impact analysis
           </button>
           <button 
            onClick={() => setInput("What are the current average weekend rates for 4-star hotels in this area?")}
            className="whitespace-nowrap px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all"
           >
            Rate benchmark
           </button>
           <button 
            onClick={() => setInput("Identify top 3 local events next month affecting hotel demand")}
            className="whitespace-nowrap px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all"
           >
            Demand forecasting
           </button>
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query live market data or property strategy..."
              className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
            />
            <button 
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className="absolute right-2 top-2 bottom-2 px-3 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-medium">
            <span className="flex items-center gap-1 uppercase tracking-wider">
              <Zap className="w-3 h-3 text-amber-400" />
              Real-Time Search Grounding Enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
