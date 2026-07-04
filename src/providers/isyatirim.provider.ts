/**
 * İş Yatırım (isyatirim.com.tr) BIST daily OHLC history. Same category of
 * source as bigpara.provider.ts -- a public, unauthenticated frontend
 * AJAX endpoint (`HisseTekil`), not a published/licensed API. Verified
 * live with no rate limiting observed across repeated requests. Several
 * independent open-source Turkish finance tools (isyatirimhisse,
 * borsapy, borsa-mcp) already rely on this exact endpoint and explicitly
 * flag it as unofficial -- same disclosure applies here.
 *
 * Only daily bars are available (no intraday), and the endpoint has no
 * "open" field -- HGDG_AOF (the day's volume-weighted average price) is
 * used as an open proxy, which is the same approximation those
 * community tools make. This is BIST's best free/legal source for
 * historical OHLC candles now that TradingView's unofficial socket is
 * blocked on Render.
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

const REST_BASE = 'https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/HisseTekil';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

function bareSymbol(symbol: string): string {
  return symbol.replace(/^BIST:/, '').toUpperCase();
}

/** İş Yatırım wants and returns dates as DD-MM-YYYY. */
function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

function parseTrDate(s: string): number {
  const [dd, mm, yyyy] = s.split('-').map(Number);
  return Date.UTC(yyyy, mm - 1, dd) / 1000;
}

interface HisseBar {
  HGDG_HS_KODU: string;
  HGDG_TARIH: string;
  HGDG_KAPANIS: number;
  HGDG_AOF: number;
  HGDG_MIN: number;
  HGDG_MAX: number;
  HGDG_HACIM: number;
}

async function fetchBars(kod: string, startDate: Date, endDate: Date): Promise<HisseBar[]> {
  const url = `${REST_BASE}?hisse=${encodeURIComponent(kod)}&startdate=${formatDate(startDate)}&enddate=${formatDate(endDate)}`;
  const res = await fetchWithTimeout(url, { headers: BROWSER_HEADERS });
  if (!res.ok) return [];
  const j = (await res.json()) as { ok?: boolean; value?: HisseBar[] };
  if (!j.ok || !j.value) return [];
  return j.value;
}

export class IsYatirimProvider implements MarketProvider {
  readonly id = 'isyatirim';
  readonly name = 'İş Yatırım (public frontend JSON, unofficial, daily BIST OHLC)';
  readonly isRealtime = false;
  readonly experimental = true;
  readonly categories: MarketCategory[] = ['bist'];

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    throw new Error('isyatirim: daily historical bars only, no streaming endpoint');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  async getQuote(symbol: string): Promise<Quote | null> {
    const kod = bareSymbol(symbol);
    if (!/^[A-Z0-9]+$/.test(kod)) return null;
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const bars = await fetchBars(kod, start, end);
    if (bars.length === 0) return null;
    const last = bars[bars.length - 1];
    return {
      symbol,
      price: last.HGDG_KAPANIS,
      change: null,
      changePercent: null,
      volume: last.HGDG_HACIM ?? null,
      timestamp: parseTrDate(last.HGDG_TARIH) * 1000,
      provider: this.id,
      delayed: true,
      experimental: true,
    };
  }

  async getCandles(symbol: string, interval: CandleInterval, limit = 200): Promise<Candle[]> {
    if (interval !== '1d') return [];
    const kod = bareSymbol(symbol);
    if (!/^[A-Z0-9]+$/.test(kod)) return [];
    const end = new Date();
    // BIST trades ~5 days/week; pad the lookback so weekends/holidays
    // still leave enough trading days to satisfy `limit`.
    const start = new Date(end.getTime() - Math.ceil(limit * 1.6) * 24 * 60 * 60 * 1000);
    const bars = await fetchBars(kod, start, end);
    if (bars.length === 0) return [];
    const sorted = [...bars].sort((a, b) => parseTrDate(a.HGDG_TARIH) - parseTrDate(b.HGDG_TARIH));
    return sorted.slice(-limit).map((bar, i, arr) => ({
      time: parseTrDate(bar.HGDG_TARIH),
      open: i > 0 ? arr[i - 1].HGDG_KAPANIS : bar.HGDG_AOF,
      high: bar.HGDG_MAX,
      low: bar.HGDG_MIN,
      close: bar.HGDG_KAPANIS,
      volume: bar.HGDG_HACIM ?? 0,
    }));
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const end = new Date();
      const from = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      const bars = await fetchBars('THYAO', from, end);
      const latencyMs = Date.now() - start;
      return {
        provider: this.id,
        healthy: bars.length > 0,
        latencyMs,
        message:
          bars.length > 0
            ? 'OK (unofficial public frontend endpoint, daily BIST OHLC history)'
            : 'no bars returned',
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
