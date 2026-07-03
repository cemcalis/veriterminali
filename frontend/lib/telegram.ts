'use client';

/** Best-effort Telegram Mini App bootstrap. No-ops safely outside Telegram
 * (e.g. plain browser during development). */
export function initTelegram(): void {
  if (typeof window === 'undefined') return;
  const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.('#0a0a0f');
    tg.setBackgroundColor?.('#0a0a0f');
  } catch {
    // ignore - not fatal if Telegram bridge API shape differs
  }
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  initDataUnsafe?: { user?: { id: number; first_name: string; username?: string } };
}
