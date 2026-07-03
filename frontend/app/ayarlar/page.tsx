'use client';

import { useEffect, useState } from 'react';
import { Settings, Bug, Database, Wifi, CheckCircle2, XCircle, TriangleAlert, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import { useMarketStore } from '@/lib/store';
import type { ProviderHealth } from '@/lib/types';

export default function AyarlarPage() {
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [cacheBackend, setCacheBackend] = useState<string>('—');
  const [loading, setLoading] = useState(true);
  const debugMode = useMarketStore((s) => s.debugMode);
  const toggleDebugMode = useMarketStore((s) => s.toggleDebugMode);
  const wsStatus = useMarketStore((s) => s.wsStatus);

  async function refresh() {
    try {
      const [health, status] = await Promise.all([api.health(), api.status()]);
      setProviders(health.providers);
      setCacheBackend(status.cacheBackend);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 20000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="pb-4">
      <header className="px-3 pt-4 flex items-center gap-2">
        <Settings size={18} className="text-emerald-400" />
        <h1 className="text-lg font-bold">Ayarlar</h1>
      </header>

      <div className="mx-3 mt-3 panel p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug size={16} className="text-slate-400" />
          <div>
            <div className="text-sm">Hata Ayıklama Modu</div>
            <div className="text-[11px] text-slate-500">Kart üzerinde sağlayıcı adını göster</div>
          </div>
        </div>
        <button
          onClick={toggleDebugMode}
          className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${debugMode ? 'bg-emerald-500' : 'bg-slate-700'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${debugMode ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      <div className="mx-3 mt-3 panel p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Wifi size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500">WebSocket Durumu</span>
        </div>
        <div className="text-sm ml-6">{wsStatus}</div>
        <div className="flex items-center gap-2 mt-1">
          <Database size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500">Önbellek</span>
        </div>
        <div className="text-sm ml-6">{cacheBackend === 'redis' ? 'Redis' : 'Bellek içi (Redis yok)'}</div>
      </div>

      <div className="mx-3 mt-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Veri Sağlayıcıları</h2>
        {loading && <div className="text-center text-sm text-slate-500 py-4">Yükleniyor…</div>}
        <div className="flex flex-col gap-2">
          {providers.map((p) => (
            <div key={p.provider} className="panel p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{p.provider}</div>
                <span className={`flex items-center gap-1 text-xs ${p.healthy ? 'price-up' : 'price-down'}`}>
                  {p.healthy ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  {p.healthy ? 'Çalışıyor' : 'Durdu'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{p.message}</div>
              <div className="flex gap-3 text-[10px] text-slate-600 mt-1">
                {p.latencyMs !== null && <span>{p.latencyMs}ms</span>}
                {p.experimental && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <TriangleAlert size={10} /> deneysel/resmi olmayan
                  </span>
                )}
                {p.requiresApiKey && (
                  <span className="flex items-center gap-1">
                    <KeyRound size={10} /> API anahtarı: {p.apiKeyPresent ? 'tanımlı (değer gizli)' : 'eksik'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
