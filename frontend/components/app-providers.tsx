'use client';

import { useEffect } from 'react';
import { useMarketSocket } from '@/lib/use-market-socket';
import { initTelegram } from '@/lib/telegram';

export function AppProviders({ children }: { children: React.ReactNode }) {
  useMarketSocket();
  useEffect(() => {
    initTelegram();
  }, []);
  return <>{children}</>;
}
