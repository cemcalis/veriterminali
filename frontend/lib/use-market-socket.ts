'use client';

import { useEffect, useRef } from 'react';
import { useMarketStore } from './store';
import type { Quote } from './types';

const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS_URL ?? 'ws://localhost:4000';

/** Opens the single shared WebSocket connection to the backend relay and
 * keeps the Zustand store in sync with live ticks. Mount once near the
 * app root. */
export function useMarketSocket() {
  const setQuote = useMarketStore((s) => s.setQuote);
  const setQuotes = useMarketStore((s) => s.setQuotes);
  const setWsStatus = useMarketStore((s) => s.setWsStatus);
  const retryRef = useRef(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (cancelled) return;
      setWsStatus('connecting');
      ws = new WebSocket(`${WS_URL}/ws`);

      ws.onopen = () => {
        retryRef.current = 0;
        setWsStatus('open');
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
        if (cancelled) return;
        const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
        retryRef.current += 1;
        retryTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
    };
  }, [setQuote, setQuotes, setWsStatus]);
}
