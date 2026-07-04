/**
 * TCMB (Turkish Central Bank) EVDS -- Turkey's official statistics/data
 * service, evds2.tcmb.gov.tr. Genuinely free and official: registering
 * at evds2.tcmb.gov.tr/index.php/yeni-kullanici-formu gets you a
 * permanent API key at no cost, no login/session/cookie trickery
 * involved (the key is a normal API credential, the same category as
 * FINNHUB_API_KEY/FMP_API_KEY elsewhere in this project).
 *
 * EVDS publishes TCMB's own official USD/EUR buying-selling reference
 * rates once per working day (~15:30 TRT) -- authoritative for TRY
 * pairs, but never real-time and never a tradable market price. Used
 * here purely as a last-resort daily reference for TRY forex pairs, the
 * same role ecb.provider.ts plays for EUR-based pairs.
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

const REST_BASE = 'https://evds2.tcmb.gov.tr/service/evds';

/** TCMB only publishes official reference rates for a small set of
 * currencies against TRY (buying series code "A"). Maps our forex
 * symbol's base currency to its EVDS series code. */
const SERIES_BY_CURRENCY: Record<string, string> = {
  USD: 'TP.DK.USD.A',
  EUR: 'TP.DK.EUR.A',
  GBP: 'TP.DK.GBP.A',
  JPY: 'TP.DK.JPY.A',
  CHF: 'TP.DK.CHF.A',
};

/** Parses a 6-letter forex pair like "USDTRY" into its EVDS series code,
 * requiring TRY as the quote currency (TCMB only publishes TRY crosses). */
function seriesForSymbol(symbol: string): string | null {
  const raw = symbol.includes(':') ? symbol.split(':')[1] : symbol;
  if (!/^[A-Z]{6}$/.test(raw)) return null;
  const base = raw.slice(0, 3);
  const quote = raw.slice(3);
  if (quote !== 'TRY') return null;
  return SERIES_BY_CURRENCY[base] ?? null;
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

export class TcmbEvdsProvider implements MarketProvider {
  readonly id = 'tcmb-evds';
  readonly name = 'TCMB EVDS (official Turkish Central Bank reference rates, free key, daily)';
  readonly isRealtime = false;
  readonly experimental = false;
  readonly categories: MarketCategory[] = ['forex'];

  private get apiKey(): string | undefined {
    return process.env.EVDS_API_KEY;
  }

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    throw new Error('tcmb-evds: daily reference rates only, no streaming');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  async getQuote(symbol: string): Promise<Quote | null> {
    if (!this.apiKey) return null;
    const series = seriesForSymbol(symbol);
    if (!series) return null;

    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const url =
      `${REST_BASE}/series=${series}&startDate=${formatDate(start)}&endDate=${formatDate(end)}` +
      `&type=json&key=${this.apiKey}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const j = (await res.json()) as { items?: Array<Record<string, string>> };
    const items = j.items ?? [];
    if (items.length === 0) return null;
    const last = items[items.length - 1];
    const seriesKey = series.replace(/\./g, '_');
    const value = Number(last[seriesKey]);
    if (!Number.isFinite(value)) return null;
    const dateStr = last.Tarih; // "DD-MM-YYYY"
    const [dd, mm, yyyy] = dateStr ? dateStr.split('-').map(Number) : [];
    const timestamp = dateStr ? Date.UTC(yyyy, mm - 1, dd) : Date.now();

    return {
      symbol,
      price: value,
      change: null,
      changePercent: null,
      timestamp,
      provider: this.id,
      delayed: true,
      experimental: false,
    };
  }

  async getCandles(_symbol: string, _interval: CandleInterval): Promise<Candle[]> {
    // Daily reference-rate series aren't candles; ecb/yahoo already cover
    // forex candle history.
    return [];
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!this.apiKey) {
      return {
        provider: this.id,
        healthy: false,
        latencyMs: null,
        message: 'EVDS_API_KEY not set (free registration at evds2.tcmb.gov.tr, no cost, no card required)',
        checkedAt: Date.now(),
        requiresApiKey: true,
        apiKeyPresent: false,
        experimental: false,
      };
    }
    const start = Date.now();
    try {
      const end = new Date();
      const from = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      const url =
        `${REST_BASE}/series=TP.DK.USD.A&startDate=${formatDate(from)}&endDate=${formatDate(end)}` +
        `&type=json&key=${this.apiKey}`;
      const res = await fetchWithTimeout(url);
      const latencyMs = Date.now() - start;
      return {
        provider: this.id,
        healthy: res.ok,
        latencyMs,
        message: res.ok ? 'OK (official TCMB daily reference rate, not real-time)' : `HTTP ${res.status}`,
        checkedAt: Date.now(),
        requiresApiKey: true,
        apiKeyPresent: true,
        experimental: false,
      };
    } catch (err) {
      return {
        provider: this.id,
        healthy: false,
        latencyMs: null,
        message: err instanceof Error ? err.message : 'unknown error',
        checkedAt: Date.now(),
        requiresApiKey: true,
        apiKeyPresent: true,
        experimental: false,
      };
    }
  }
}
