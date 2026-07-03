'use client';

import { useEffect, useState } from 'react';
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
      <header className="px-3 pt-4">
        <h1 className="text-lg font-bold">Ayarlar</h1>
      </header>

      <div className="mx-3 mt-3 panel p-3 flex items-center justify-between">
        <div>
          <div className="text-sm">Hata Ayıklama Modu</div>
          <div className="text-[11px] text-slate-500">Kart üzerinde sağlayıcı adını göster</div>
        </div>
        <button
          onClick={toggleDebugMode}
          className={`w-11 h-6 rounded-full relative transition-colors ${debugMode ? 'bg-emerald-500' : 'bg-slate-700'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${debugMode ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      <div className="mx-3 mt-3 panel p-3">
        <div className="text-xs text-slate-500">WebSocket Durumu</div>
        <div className="text-sm mt-1">{wsStatus}</div>
        <div className="text-xs text-slate-500 mt-2">Önbellek</div>
        <div className="text-sm mt-1">{cacheBackend === 'redis' ? 'Redis' : 'Bellek içi (Redis yok)'}</div>
      </div>

      <div className="mx-3 mt-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Veri Sağlayıcıları</h2>
        {loading && <div className="text-center text-sm text-slate-500 py-4">Yükleniyor…</div>}
        <div className="flex flex-col gap-2">
          {providers.map((p) => (
            <div key={p.provider} className="panel p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{p.provider}</div>
                <span className={`text-xs ${p.healthy ? 'price-up' : 'price-down'}`}>
                  {p.healthy ? 'Çalışıyor' : 'Durdu'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{p.message}</div>
              <div className="flex gap-3 text-[10px] text-slate-600 mt-1">
                {p.latencyMs !== null && <span>{p.latencyMs}ms</span>}
                {p.experimental && <span className="text-amber-500">deneysel/resmi olmayan</span>}
                {p.requiresApiKey && (
                  <span>API anahtarı: {p.apiKeyPresent ? 'tanımlı (değer gizli)' : 'eksik'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
