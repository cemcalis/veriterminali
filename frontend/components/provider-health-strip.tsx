'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProviderHealth } from '@/lib/types';

export function ProviderHealthStrip() {
  const [providers, setProviders] = useState<ProviderHealth[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await api.health();
        if (!cancelled) setProviders(res.providers);
      } catch {
        // keep last known state; settings page surfaces the full error
      }
    }
    refresh();
    const timer = setInterval(refresh, 20000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <section className="px-4 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sağlayıcı Durumu</h2>
        <Link href="/ayarlar" className="flex items-center gap-0.5 text-[11px] text-emerald-400">
          Detay <ChevronRight size={12} />
        </Link>
      </div>
      <div className="panel-elevated p-3 flex flex-wrap gap-2">
        {!providers &&
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-6 w-20" />)}
        {providers?.map((p) => (
          <span
            key={p.provider}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border ${
              p.healthy ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' : 'border-red-500/30 text-red-300 bg-red-500/10'
            }`}
          >
            {p.healthy ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
            {p.provider}
          </span>
        ))}
      </div>
    </section>
  );
}
