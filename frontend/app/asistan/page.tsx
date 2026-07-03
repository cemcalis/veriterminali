'use client';

import { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  sources?: string[];
  disclaimer?: string;
}

const SUGGESTIONS = ['GARAN fiyatı nedir', 'THYAO haberleri', 'En çok yükselenler'];

export default function AsistanPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.ai.ask(question);
      setMessages((m) => [...m, { role: 'assistant', text: res.answer, sources: res.sources, disclaimer: res.disclaimer }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Şu anda yanıt alınamadı, lütfen tekrar deneyin.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-4 flex flex-col h-[calc(100dvh-140px)]">
      <header className="px-4 pt-4 flex items-center gap-2">
        <Sparkles size={18} className="text-emerald-400" />
        <h1 className="text-lg font-bold">Veri Asistanı</h1>
      </header>
      <p className="px-4 mt-1 text-[11px] text-slate-500">
        Yanıtlar yalnızca canlı, gerçek verimize dayanır. Yatırım tavsiyesi vermez.
      </p>

      <div className="flex-1 overflow-y-auto px-4 mt-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="text-[11px] px-3 py-1.5 rounded-full border border-[var(--border)] text-slate-400"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                m.role === 'user' ? 'gradient-accent text-black' : 'panel-elevated'
              }`}
            >
              {m.text}
              {m.disclaimer && <div className="mt-2 text-[10px] text-slate-500 italic">{m.disclaimer}</div>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="panel-elevated px-3 py-2 rounded-2xl">
              <Loader2 size={14} className="animate-spin text-slate-500" />
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="px-4 pt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bir soru sorun..."
          className="flex-1 panel px-3 py-2.5 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="gradient-accent text-black rounded-xl px-3.5 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
