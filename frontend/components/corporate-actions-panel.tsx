'use client';

import { useEffect, useState } from 'react';
import { Landmark, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import type { CorporateActionItem } from '@/lib/types';

/** Real dividend/capital-increase/merger announcements for a BIST symbol,
 * filtered from the same live KAP feed as NewsFeed. */
export function CorporateActionsPanel({ symbol }: { symbol: string }) {
  const [items, setItems] = useState<CorporateActionItem[] | null>(null);

  useEffect(() => {
    setItems(null);
    api.corporateActions
      .forSymbol(symbol)
      .then((res) => setItems(res.items))
      .catch(() => setItems([]));
  }, [symbol]);

  if (items !== null && items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        <Landmark size={13} /> Kurumsal Aksiyonlar
      </h2>
      {items === null && <div className="panel-elevated p-3 text-xs text-slate-500">Yükleniyor…</div>}
      {items?.map((item) => (
        <a
          key={item.disclosureIndex}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="panel-elevated p-3 flex items-start justify-between gap-2 hover:bg-white/[0.02] transition-colors"
        >
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 mb-1">{item.publishDate}</div>
            <div className="text-xs text-slate-200 leading-snug">{item.title}</div>
          </div>
          <ExternalLink size={13} className="shrink-0 text-slate-600 mt-1" />
        </a>
      ))}
    </div>
  );
}
