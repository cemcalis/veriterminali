'use client';

import { useMarketStore } from './store';

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  destructive_text_color?: string;
}

interface TelegramSafeAreaInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface TelegramHapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  colorScheme?: 'light' | 'dark';
  themeParams?: TelegramThemeParams;
  safeAreaInset?: TelegramSafeAreaInset;
  contentSafeAreaInset?: TelegramSafeAreaInset;
  HapticFeedback?: TelegramHapticFeedback;
  onEvent?: (event: string, cb: () => void) => void;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
  };
}

function getTg(): TelegramWebApp | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
}

function applyThemeVars(tg: TelegramWebApp): void {
  const t = tg.themeParams;
  const root = document.documentElement.style;
  if (t?.bg_color) root.setProperty('--tg-bg', t.bg_color);
  if (t?.secondary_bg_color) root.setProperty('--tg-panel', t.secondary_bg_color);
  if (t?.text_color) root.setProperty('--tg-text', t.text_color);
  if (t?.hint_color) root.setProperty('--tg-hint', t.hint_color);
  if (t?.button_color) root.setProperty('--tg-accent', t.button_color);
  if (t?.link_color) root.setProperty('--tg-link', t.link_color);
  root.setProperty('--tg-color-scheme', tg.colorScheme ?? 'dark');

  const safeTop = tg.contentSafeAreaInset?.top ?? tg.safeAreaInset?.top ?? 0;
  const safeBottom = tg.contentSafeAreaInset?.bottom ?? tg.safeAreaInset?.bottom ?? 0;
  root.setProperty('--tg-safe-top', `${safeTop}px`);
  root.setProperty('--tg-safe-bottom', `${safeBottom}px`);
}

/** Best-effort Telegram Mini App bootstrap. No-ops safely outside Telegram
 * (e.g. plain browser during development). */
export function initTelegram(): void {
  const tg = getTg();
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.('#0a0a0f');
    tg.setBackgroundColor?.('#0a0a0f');
    applyThemeVars(tg);
    tg.onEvent?.('themeChanged', () => applyThemeVars(tg));
    tg.onEvent?.('viewportChanged', () => applyThemeVars(tg));

    const u = tg.initDataUnsafe?.user;
    if (u) {
      useMarketStore.getState().setTelegramUser({
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        username: u.username,
        photoUrl: u.photo_url,
      });
    }
  } catch {
    // ignore - not fatal if Telegram bridge API shape differs
  }
}

type HapticStyle = 'light' | 'medium' | 'heavy' | 'select' | 'success' | 'warning' | 'error';

/** Fires Telegram haptic feedback if available; silently no-ops in a plain
 * browser. Safe to call from any click handler. */
export function haptic(style: HapticStyle = 'light'): void {
  const tg = getTg();
  const h = tg?.HapticFeedback;
  if (!h) return;
  try {
    if (style === 'select') h.selectionChanged();
    else if (style === 'success' || style === 'warning' || style === 'error') h.notificationOccurred(style);
    else h.impactOccurred(style);
  } catch {
    // ignore
  }
}

export function isTelegramEnvironment(): boolean {
  return !!getTg();
}
