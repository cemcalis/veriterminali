'use client';

import { useEffect, useRef } from 'react';
import { useMarketStore } from './store';
import type { Quote } from './types';

const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS_URL ?? 'ws://localhost:4000';

let socket: WebSocket | null = null;
// Ref-counted set of symbols the app currently wants streamed, kept alive
// across reconnects (module scope survives socket churn) so a transient
// disconnect can resend the full desired set on the new connection instead
// of relying on mounted hooks to rerun (they don't, since their `key` is
// unchanged by a reconnect).
const activeSubscriptions = new Map<string, number>();
const pendingSubscribe = new Set<string>();
const pendingUnsubscribe = new Set<string>();

function flushPending() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  if (pendingSubscribe.size > 0) {
    socket.send(JSON.stringify({ type: 'subscribe', symbols: [...pendingSubscribe] }));
    pendingSubscribe.clear();
  }
  if (pendingUnsubscribe.size > 0) {
    socket.send(JSON.stringify({ type: 'unsubscribe', symbols: [...pendingUnsubscribe] }));
    pendingUnsubscribe.clear();
  }
}

/** Requests live streaming for the given symbols (category views, chart
 * page, watchlist). Ref-counted server-side, so calling this repeatedly
 * for the same symbols across mounted components is safe. */
export function subscribeSymbols(symbols: string[]): void {
  if (symbols.length === 0) return;
  symbols.forEach((s) => {
    activeSubscriptions.set(s, (activeSubscriptions.get(s) ?? 0) + 1);
    pendingSubscribe.add(s);
  });
  flushPending();
}

/** Releases interest registered via subscribeSymbols (e.g. on unmount or
 * when navigating away from a category/chart). */
export function unsubscribeSymbols(symbols: string[]): void {
  if (symbols.length === 0) return;
  symbols.forEach((s) => {
    const next = (activeSubscriptions.get(s) ?? 0) - 1;
    if (next <= 0) {
      activeSubscriptions.delete(s);
      pendingUnsubscribe.add(s);
    } else {
      activeSubscriptions.set(s, next);
    }
  });
  flushPending();
}

/** Convenience hook: subscribes to `symbols` while the component is
 * mounted (or the symbol list changes) and unsubscribes on cleanup. */
export function useSymbolSubscription(symbols: string[]): void {
  const key = symbols.join(',');
  useEffect(() => {
    const list = key ? key.split(',') : [];
    subscribeSymbols(list);
    return () => unsubscribeSymbols(list);
  }, [key]);
}

/** Opens the single shared WebSocket connection to the backend relay and
 * keeps the Zustand store in sync with live ticks. Mount once near the
 * app root. */
export function useMarketSocket() {
  const setQuote = useMarketStore((s) => s.setQuote);
  const setQuotes = useMarketStore((s) => s.setQuotes);
  const setWsStatus = useMarketStore((s) => s.setWsStatus);
  const retryRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (cancelled) return;
      setWsStatus('connecting');
      const ws = new WebSocket(`${WS_URL}/ws`);
      socket = ws;

      ws.onopen = () => {
        retryRef.current = 0;
        setWsStatus('open');
        // Resend everything currently desired, not just what's pending -
        // the new backend connection starts with no subscriptions of its
        // own, and mounted useSymbolSubscription hooks won't rerun just
        // because the socket reconnected.
        if (activeSubscriptions.size > 0) {
          ws.send(JSON.stringify({ type: 'subscribe', symbols: [...activeSubscriptions.keys()] }));
        }
        flushPending();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as
            | { type: 'snapshot'; quotes: Quote[] }
            | { type: 'tick'; quote: Quote };
          if (msg.type === 'snapshot') setQuotes(msg.quotes);
          if (msg.type === 'tick') setQuote(msg.quote);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        setWsStatus('closed');
        if (socket === ws) socket = null;
        if (cancelled) return;
        const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
        retryRef.current += 1;
        retryTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
      socket = null;
    };
  }, [setQuote, setQuotes, setWsStatus]);
}
