import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, Terminal } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface AIProps {
  onBack: () => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const AI: React.FC<AIProps> = ({ onBack }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Система SQUWIZ AI активирована. Я анализирую реальность. Задавай вопросы.' }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    const newHistory: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      // Initialize Gemini client with API Key from environment
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Prepare history for Gemini chat session
      // Map 'assistant' (UI) to 'model' (Gemini)
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: "You are SQUWIZ AI. The Pulse of Truth. High-End Minimalist personality. Concise, mysterious, helpful.",
        },
        history: history
      });

      const result = await chat.sendMessage({ message: userMsg });
      const aiText = result.text;

      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);

    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMsg = "Ошибка соединения.";
      if (error.message?.includes('API key')) {
         errorMsg = "Ошибка ключа API.";
      }
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black transition-colors duration-300 relative">
      <div className="flex items-center justify-between p-4 bg-white/90 dark:bg-black/90 backdrop-blur-md sticky top-0 z-10 shadow-sm border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full dark:text-white"><ArrowLeft /></button>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-lg">
                    <Bot className="text-white dark:text-black" size={20} />
                </div>
                <div>
                    <h1 className="font-bold dark:text-white text-lg">SQUWIZ AI</h1>
                    <p className="text-xs text-green-500 flex items-center gap-1 font-mono font-bold tracking-wider">
                        <Terminal size={10} /> ONLINE
                    </p>
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-[#0a0a0a]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[24px] ${
              msg.role === 'user' 
                ? 'bg-black text-white dark:bg-white dark:text-black rounded-tr-none' 
                : 'bg-white text-black dark:bg-gray-900 dark:text-gray-100 shadow-sm border border-gray-100 dark:border-gray-800 rounded-tl-none'
            }`}>
               <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-white dark:bg-gray-900 p-4 rounded-[24px] rounded-tl-none border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
             </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 pb-8 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800">
         <div className="flex gap-2 max-w-2xl mx-auto">
            <input 
              className="flex-1 bg-gray-100 dark:bg-gray-900 dark:text-white rounded-full px-6 py-4 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all placeholder:text-gray-400"
              placeholder="Спроси у матрицы..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <button 
              onClick={handleSend} 
              disabled={!input.trim() || loading}
              className="w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform shadow-lg"
            >
              <Send size={24} className={loading ? "opacity-0" : "opacity-100"} />
              {loading && <div className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" /></div>}
            </button>
         </div>
      </div>
    </div>
  );
};
