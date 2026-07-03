'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings, Bug, Wifi, WifiOff, CheckCircle2, XCircle, TriangleAlert, KeyRound, User, Database, BookOpen, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useMarketStore } from '@/lib/store';
import { haptic } from '@/lib/telegram';
import type { ProviderHealth } from '@/lib/types';

export default function AyarlarPage() {
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [cacheBackend, setCacheBackend] = useState<string>('—');
  const [loading, setLoading] = useState(true);
  const debugMode = useMarketStore((s) => s.debugMode);
  const toggleDebugMode = useMarketStore((s) => s.toggleDebugMode);
  const wsStatus = useMarketStore((s) => s.wsStatus);
  const telegramUser = useMarketStore((s) => s.telegramUser);

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

  const allHealthy = providers.length > 0 && providers.every((p) => p.healthy);
  const connected = wsStatus === 'open';

  return (
    <div className="pb-4">
      <header className="px-4 pt-4 flex items-center gap-2">
        <Settings size={18} className="text-emerald-400" />
        <h1 className="text-lg font-bold">Ayarlar</h1>
      </header>

      {telegramUser && (
        <div className="mx-4 mt-3 panel-elevated p-3 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl overflow-hidden shrink-0 gradient-accent flex items-center justify-center text-black font-semibold">
            {telegramUser.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={telegramUser.photoUrl} alt={telegramUser.firstName} className="h-full w-full object-cover" />
            ) : (
              <User size={18} />
            )}
          </div>
          <div>
            <div className="text-sm font-medium">
              {telegramUser.firstName} {telegramUser.lastName ?? ''}
            </div>
            {telegramUser.username && <div className="text-[11px] text-slate-500">@{telegramUser.username}</div>}
          </div>
        </div>
      )}

      {/* Public system status: no provider names, no cache/backend
          internals, no counts -- just "is data flowing or not". */}
      <div className="mx-4 mt-3 panel-elevated p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {connected ? <Wifi size={16} className="text-emerald-400" /> : <WifiOff size={16} className="text-red-400" />}
          <span className="text-sm">{connected ? 'Bağlantı aktif' : 'Bağlantı kesildi'}</span>
        </div>
        {!loading && (
          <span className={`flex items-center gap-1 text-xs ${allHealthy ? 'price-up' : 'text-amber-400'}`}>
            {allHealthy ? <CheckCircle2 size={13} /> : <TriangleAlert size={13} />}
            {allHealthy ? 'Sistemler sağlıklı' : 'Bazı veriler gecikmeli olabilir'}
          </span>
        )}
      </div>

      <Link href="/rehber" className="mx-4 mt-3 panel-elevated p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-slate-400" />
          <div>
            <div className="text-sm">Rehber</div>
            <div className="text-[11px] text-slate-500">AKD, derinlik, RSI ve daha fazlasının açıklaması</div>
          </div>
        </div>
        <ChevronRight size={15} className="text-slate-600" />
      </Link>

      <div className="mx-4 mt-3 panel-elevated p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug size={16} className="text-slate-400" />
          <div>
            <div className="text-sm">Geliştirici Modu</div>
            <div className="text-[11px] text-slate-500">Sağlayıcı ve teknik detayları göster</div>
          </div>
        </div>
        <button
          onClick={() => {
            haptic('select');
            toggleDebugMode();
          }}
          className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${debugMode ? 'bg-emerald-500' : 'bg-slate-700'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${debugMode ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      {debugMode && (
        <>
          <div className="mx-4 mt-3 panel-elevated p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Wifi size={14} className="text-slate-400" />
              <span className="text-xs text-slate-500">WebSocket Durumu</span>
            </div>
            <div className="text-sm ml-6 font-mono">{wsStatus}</div>
            <div className="flex items-center gap-2 mt-1">
              <Database size={14} className="text-slate-400" />
              <span className="text-xs text-slate-500">Önbellek</span>
            </div>
            <div className="text-sm ml-6 font-mono">{cacheBackend === 'redis' ? 'Redis' : 'Bellek içi (Redis yok)'}</div>
          </div>

          <div className="mx-4 mt-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Veri Sağlayıcıları (geliştirici)</h2>
            <div className="flex flex-col gap-2">
              {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-2xl" />)}
              {!loading &&
                providers.map((p) => (
                  <div key={p.provider} className="panel-elevated p-3">
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
        </>
      )}
    </div>
  );
}
