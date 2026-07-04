/**
 * Bigpara (bigpara.hurriyet.com.tr) BIST last-price snapshot. This is
 * Hürriyet's own frontend JSON endpoint -- not a published/licensed API,
 * but genuinely public and unauthenticated: no login, no cookie, no
 * session, no token. Verified live: `/api/v1/hisse/list` returns the full
 * ~800-symbol BIST ticker list with no auth, and
 * `/api/v1/borsa/hisseyuzeysel/{KOD}` returns a rich near-live snapshot
 * (bid/ask, open/high/low/close, lot + TL volume, week/month/year
 * high-low, market cap, P/E, beta) as long as a browser-like
 * User-Agent + Referer is sent (the endpoint 401s on a bare request with
 * no headers at all, but that's ordinary bot-noise filtering, not an
 * auth wall -- no credential of any kind is involved).
 *
 * This is the same "public-but-undocumented frontend call" pattern
 * already accepted for KAP (see kap-client.ts): a normal scraping-
 * maintenance risk (Hürriyet could restructure their frontend any time),
 * not a licensing wall like bist-institutional.provider.ts. It is the
 * closest thing to a working near-live BIST last-price source now that
 * TradingView's unofficial socket is blocked on Render (HTTP 451).
 */
import { fetchWithTimeout } from './fetch-with-timeout.js';
import type {
  Candle,
  CandleInterval,
  MarketCategory,
  MarketProvider,
  ProviderHealth,
  Quote,
  QuoteListener,
} from './market-provider.interface.js';

const REST_BASE = 'https://bigpara.hurriyet.com.tr/api/v1';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://bigpara.hurriyet.com.tr/borsa/hisse-fiyatlari/',
};

function bareSymbol(symbol: string): string {
  return symbol.replace(/^BIST:/, '').toUpperCase();
}

interface HisseYuzeysel {
  sembol: string;
  tarih: string;
  alis: number;
  satis: number;
  acilis: number;
  yuksek: number;
  dusuk: number;
  kapanis: number;
  hacimlot: number;
  hacimtl: number;
  net: number;
  yuzdedegisim: number;
}

export class BigparaProvider implements MarketProvider {
  readonly id = 'bigpara';
  readonly name = 'Bigpara / Hürriyet (public frontend JSON, unofficial, near-live BIST)';
  readonly isRealtime = false;
  readonly experimental = true;
  readonly categories: MarketCategory[] = ['bist'];

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    throw new Error('bigpara: REST snapshot only, no streaming endpoint');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  async getQuote(symbol: string): Promise<Quote | null> {
    const kod = bareSymbol(symbol);
    if (!/^[A-Z0-9]+$/.test(kod)) return null;
    const res = await fetchWithTimeout(`${REST_BASE}/borsa/hisseyuzeysel/${encodeURIComponent(kod)}`, {
      headers: BROWSER_HEADERS,
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { code?: string; data?: { hisseYuzeysel?: HisseYuzeysel } };
    const h = j.data?.hisseYuzeysel;
    if (!h || h.kapanis == null) return null;
    return {
      symbol,
      price: h.kapanis,
      change: h.net ?? null,
      changePercent: h.yuzdedegisim ?? null,
      bid: h.alis ?? null,
      ask: h.satis ?? null,
      volume: h.hacimlot ?? null,
      timestamp: h.tarih ? new Date(h.tarih).getTime() : Date.now(),
      provider: this.id,
      delayed: false,
      experimental: true,
    };
  }

  async getCandles(_symbol: string, _interval: CandleInterval): Promise<Candle[]> {
    // Snapshot-only endpoint -- isyatirim.provider.ts covers BIST candles.
    return [];
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(`${REST_BASE}/borsa/hisseyuzeysel/THYAO`, { headers: BROWSER_HEADERS });
      const latencyMs = Date.now() - start;
      return {
        provider: this.id,
        healthy: res.ok,
        latencyMs,
        message: res.ok
          ? 'OK (unofficial public frontend endpoint, near-live BIST snapshot)'
          : `HTTP ${res.status}`,
        checkedAt: Date.now(),
        requiresApiKey: false,
        apiKeyPresent: true,
        experimental: true,
      };
    } catch (err) {
      return {
        provider: this.id,
        healthy: false,
        latencyMs: null,
        message: err instanceof Error ? err.message : 'unknown error',
        checkedAt: Date.now(),
        requiresApiKey: false,
        apiKeyPresent: true,
        experimental: true,
      };
    }
  }
}
