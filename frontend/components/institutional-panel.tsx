'use client';

import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { InfoTip } from './info-tip';
import type { InstitutionalResult } from '@/lib/types';

type Kind = 'depth' | 'akd' | 'teorik' | 'takas';

const LABELS: Record<Kind, string> = {
  depth: '25 Kademe Derinlik',
  akd: 'Aracı Kurum Dağılımı',
  teorik: 'Teorik Fiyat',
  takas: 'Takas Verileri',
};

const GLOSSARY_SLUGS: Record<Kind, string> = {
  depth: 'derinlik',
  akd: 'akd',
  teorik: 'teorik-fiyat',
  takas: 'takas',
};

/** Honest empty-state for the four BIST datasets that require a licensed
 * data vendor (VERDA/Foreks/Matriks/Bloomberg) -- see
 * bist-institutional.provider.ts. Never renders fabricated numbers. */
function VendorGate({ kind, result }: { kind: Kind; result: InstitutionalResult<unknown> | null }) {
  if (!result) {
    return <div className="panel-elevated p-3 text-xs text-slate-500">Yükleniyor…</div>;
  }
  if (result.available) {
    // Real vendor wired up -- render raw JSON until a dedicated view exists.
    return <pre className="panel-elevated p-3 text-[10px] overflow-x-auto">{JSON.stringify(result.data, null, 2)}</pre>;
  }
  return (
    <div className="panel-elevated p-3 flex gap-2.5">
      <Lock size={15} className="shrink-0 text-slate-500 mt-0.5" />
      <div>
        <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          {LABELS[kind]}
          <InfoTip slug={GLOSSARY_SLUGS[kind]} />
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{result.message}</p>
      </div>
    </div>
  );
}

/** Shows Derinlik/AKD/Teorik/Takas for a BIST symbol. Each panel is
 * independently fetched and independently honest about vendor gating --
 * this is a documented product limitation, not a bug. */
export function InstitutionalPanel({ symbol }: { symbol: string }) {
  const [results, setResults] = useState<Partial<Record<Kind, InstitutionalResult<unknown>>>>({});

  useEffect(() => {
    setResults({});
    const calls: [Kind, Promise<InstitutionalResult<unknown>>][] = [
      ['depth', api.institutional.depth(symbol)],
      ['akd', api.institutional.akd(symbol)],
      ['teorik', api.institutional.teorik(symbol)],
      ['takas', api.institutional.takas(symbol)],
    ];
    calls.forEach(([kind, promise]) => {
      promise.then((r) => setResults((prev) => ({ ...prev, [kind]: r }))).catch(() => {});
    });
  }, [symbol]);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Kurumsal Veri</h2>
      {(['depth', 'akd', 'teorik', 'takas'] as Kind[]).map((kind) => (
        <VendorGate key={kind} kind={kind} result={results[kind] ?? null} />
      ))}
    </div>
  );
}
