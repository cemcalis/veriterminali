'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAllSessions, type SessionState } from '@/lib/exchange-sessions';

const REASON_LABEL: Record<SessionState['reason'], string> = {
  weekend: 'Hafta sonu',
  holiday: 'Resmi tatil',
  'after-hours': 'Kapalı',
  open: 'Açık',
  '24h': 'Açık',
};

/** Per-exchange open/closed strip (BIST, NASDAQ, Forex, Kripto) -- distinct
 * from MarketStatus above it, which only reports our own WS connection
 * health, not whether the underlying market is actually trading. */
export function ExchangeSessionsStrip() {
  const [sessions, setSessions] = useState<SessionState[] | null>(null);

  useEffect(() => {
    setSessions(getAllSessions());
    const id = setInterval(() => setSessions(getAllSessions()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!sessions) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="mx-4 mt-2 panel-elevated px-3 py-2.5 flex items-center justify-between gap-1"
    >
      {sessions.map((s) => (
        <div key={s.exchange} className="flex flex-1 flex-col items-center gap-1 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.isOpen ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            <span className="text-[11px] font-medium text-[var(--foreground)] truncate">{s.label}</span>
          </span>
          <span className={`text-[10px] font-mono ${s.isOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
            {REASON_LABEL[s.reason]} · {s.localTime}
          </span>
        </div>
      ))}
    </motion.div>
  );
}
