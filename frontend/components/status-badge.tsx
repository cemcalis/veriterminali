'use client';

import { Radio, Zap, Clock, TriangleAlert, CircleOff } from 'lucide-react';
import { useMarketStore } from '@/lib/store';
import type { DataStatus } from '@/lib/types';

const CONFIG: Record<DataStatus, { label: string; icon: typeof Radio; className: string; dotClassName: string }> = {
  live: { label: 'Canlı', icon: Radio, className: 'text-emerald-400', dotClassName: 'bg-emerald-400' },
  'near-live': { label: 'Yakın-canlı', icon: Zap, className: 'text-teal-400', dotClassName: 'bg-emerald-400' },
  delayed: { label: 'Gecikmeli', icon: Clock, className: 'text-amber-400', dotClassName: 'bg-amber-400' },
  fallback: { label: 'Yedek', icon: TriangleAlert, className: 'text-orange-400', dotClassName: 'bg-amber-400' },
  unavailable: { label: 'Yok', icon: CircleOff, className: 'text-slate-500', dotClassName: 'bg-slate-600' },
};

/** Public view: a plain colored dot signaling data freshness, with no
 * provider name or technical jargon. Developer/debug mode (toggled in
 * Ayarlar) reveals the full freshness label so the distinction between
 * live/near-live/delayed/fallback stays available without ever surfacing
 * it to normal users by default. */
export function StatusBadge({ status }: { status?: DataStatus }) {
  const debugMode = useMarketStore((s) => s.debugMode);
  const cfg = CONFIG[status ?? 'unavailable'];

  if (!debugMode) {
    const pulsing = status === 'live' || status === 'near-live';
    return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dotClassName} ${pulsing ? 'animate-pulse' : ''}`} />;
  }

  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 ${cfg.className}`} title={cfg.label}>
      <Icon size={11} strokeWidth={2} />
      <span className="text-[10px]">{cfg.label}</span>
    </span>
  );
}
