import { Radio, Zap, Clock, TriangleAlert, CircleOff } from 'lucide-react';
import type { DataStatus } from '@/lib/types';

const CONFIG: Record<DataStatus, { label: string; icon: typeof Radio; className: string }> = {
  live: { label: 'Canlı', icon: Radio, className: 'text-emerald-400' },
  'near-live': { label: 'Yakın-canlı', icon: Zap, className: 'text-teal-400' },
  delayed: { label: 'Gecikmeli', icon: Clock, className: 'text-amber-400' },
  fallback: { label: 'Yedek', icon: TriangleAlert, className: 'text-orange-400' },
  unavailable: { label: 'Yok', icon: CircleOff, className: 'text-slate-500' },
};

export function StatusBadge({ status, compact = false }: { status?: DataStatus; compact?: boolean }) {
  const cfg = CONFIG[status ?? 'unavailable'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 ${cfg.className}`} title={cfg.label}>
      <Icon size={compact ? 11 : 12} strokeWidth={2} />
      {!compact && <span className="text-[10px]">{cfg.label}</span>}
    </span>
  );
}
