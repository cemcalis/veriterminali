'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Landmark } from 'lucide-react';
import { api } from '@/lib/api';
import type { MacroEvent } from '@/lib/types';

const CATEGORY_LABELS: Record<MacroEvent['category'], string> = {
  faiz_karari: 'PPK Faiz Kararı',
  enflasyon_raporu: 'Enflasyon Raporu',
  finansal_istikrar_raporu: 'Finansal İstikrar Raporu',
  fomc: 'FOMC Toplantısı',
};

const CATEGORY_TONE: Record<MacroEvent['category'], string> = {
  faiz_karari: 'text-rose-300 bg-rose-500/10 border-rose-500/25',
  enflasyon_raporu: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  finansal_istikrar_raporu: 'text-sky-300 bg-sky-500/10 border-sky-500/25',
  fomc: 'text-violet-300 bg-violet-500/10 border-violet-500/25',
};

const COUNTRY_FLAG: Record<MacroEvent['country'], string> = { TR: '🇹🇷', US: '🇺🇸' };

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function TakvimPage() {
  const [events, setEvents] = useState<MacroEvent[]>([]);
  const [country, setCountry] = useState<'all' | 'TR' | 'US'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    api.calendar
      .economic(today)
      .then((res) => setEvents(res.events))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (country === 'all' ? events : events.filter((e) => e.country === country)),
    [events, country],
  );

  return (
    <div className="pb-6">
      <header className="px-4 pt-4 flex items-center gap-2">
        <CalendarDays size={18} className="text-emerald-400" />
        <h1 className="text-lg font-bold">Ekonomik Takvim</h1>
      </header>
      <p className="px-4 mt-1 text-[11px] text-slate-500">
        TCMB ve Fed'in kendi resmi takvimlerinden alınan gerçek toplantı/rapor tarihleri.
      </p>

      <div className="px-4 mt-3 flex gap-2">
        {(['all', 'TR', 'US'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCountry(c)}
            className={`rounded-full px-3 py-1.5 text-[11px] border transition-colors ${
              country === c ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'border-[var(--border)] text-slate-400'
            }`}
          >
            {c === 'all' ? 'Tümü' : `${COUNTRY_FLAG[c]} ${c}`}
          </button>
        ))}
      </div>

      <div className="mx-4 mt-3 flex flex-col gap-2">
        {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 w-full rounded-2xl" />)}
        {!loading && filtered.length === 0 && (
          <div className="panel-elevated flex flex-col items-center gap-2 py-8 text-slate-500">
            <Landmark size={26} strokeWidth={1.5} />
            <span className="text-sm">Yaklaşan etkinlik bulunamadı</span>
          </div>
        )}
        {filtered.map((e, i) => (
          <div key={`${e.date}-${i}`} className="panel-elevated p-3 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${CATEGORY_TONE[e.category]}`}>
                  {CATEGORY_LABELS[e.category]}
                </span>
                <span className="text-[11px] text-slate-500">
                  {COUNTRY_FLAG[e.country]} {e.country}
                </span>
              </div>
              <div className="text-sm text-slate-200">{e.title}</div>
            </div>
            <div className="text-xs font-mono text-slate-400 text-right shrink-0">{formatDate(e.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
