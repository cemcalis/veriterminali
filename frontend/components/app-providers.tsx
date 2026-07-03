'use client';

import { useEffect } from 'react';
import { useMarketSocket } from '@/lib/use-market-socket';
import { initTelegram } from '@/lib/telegram';
import { useMarketStore } from '@/lib/store';

export function AppProviders({ children }: { children: React.ReactNode }) {
  useMarketSocket();
  useEffect(() => {
    initTelegram();
    useMarketStore.getState().hydrateFromStorage();
  }, []);
  return <>{children}</>;
}
