'use client';

import { useEffect, useState } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import type { DisclosureCategory, NewsItem } from '@/lib/types';

const CATEGORY_LABELS_TR: Record<DisclosureCategory, string> = {
  temettu: 'Temettü',
  sermaye_artirimi: 'Sermaye Artırımı',
  birlesme_devralma: 'Birleşme/Devralma',
  genel_kurul: 'Genel Kurul',
  finansal_rapor: 'Finansal Rapor',
  spk_karari: 'SPK Kararı',
  diger: 'Diğer',
};

const CATEGORY_TONE: Record<DisclosureCategory, string> = {
  temettu: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
  sermaye_artirimi: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  birlesme_devralma: 'text-sky-300 bg-sky-500/10 border-sky-500/25',
  genel_kurul: 'text-violet-300 bg-violet-500/10 border-violet-500/25',
  finansal_rapor: 'text-teal-300 bg-teal-500/10 border-teal-500/25',
  spk_karari: 'text-rose-300 bg-rose-500/10 border-rose-500/25',
  diger: 'text-slate-400 bg-white/5 border-[var(--border)]',
};

/** Real KAP (Kamuyu Aydınlatma Platformu) disclosures for a BIST symbol --
 * free, public, no vendor gate (unlike InstitutionalPanel). */
export function NewsFeed({ symbol }: { symbol: string }) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setItems(null);
    setError(false);
    api.news
      .forSymbol(symbol)
      .then((res) => setItems(res.items))
      .catch(() => setError(true));
  }, [symbol]);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        <Newspaper size={13} /> KAP Bildirimleri
      </h2>
      {items === null && !error && <div className="panel-elevated p-3 text-xs text-slate-500">Yükleniyor…</div>}
      {error && <div className="panel-elevated p-3 text-xs text-slate-500">KAP'a şu anda ulaşılamıyor.</div>}
      {items?.length === 0 && <div className="panel-elevated p-3 text-xs text-slate-500">Bildirim bulunamadı.</div>}
      {items?.map((item) => (
        <a
          key={item.disclosureIndex}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="panel-elevated p-3 flex items-start justify-between gap-2 hover:bg-white/[0.02] transition-colors"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${CATEGORY_TONE[item.category]}`}>
                {CATEGORY_LABELS_TR[item.category]}
              </span>
              <span className="text-[10px] text-slate-500">{item.publishDate}</span>
            </div>
            <div className="text-xs text-slate-200 leading-snug">{item.title}</div>
          </div>
          <ExternalLink size={13} className="shrink-0 text-slate-600 mt-1" />
        </a>
      ))}
    </div>
  );
}
