/**
 * Fallback provider using Yahoo Finance's unofficial public chart/quote
 * endpoints. No API key required, but this is an undocumented endpoint
 * that Yahoo can rate-limit or change without notice -- use only as a
 * delayed/near-real-time fallback when better sources are unavailable.
 */
import type {
  Candle,
  CandleInterval,
  MarketCategory,
  MarketProvider,
  ProviderHealth,
  Quote,
  QuoteListener,
} from './market-provider.interface.js';

const CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const INTERVAL_MAP: Record<CandleInterval, { interval: string; range: string }> = {
  '1m': { interval: '1m', range: '1d' },
  '5m': { interval: '5m', range: '5d' },
  '15m': { interval: '15m', range: '5d' },
  '1h': { interval: '60m', range: '1mo' },
  '4h': { interval: '60m', range: '3mo' },
  '1d': { interval: '1d', range: '1y' },
};

function toYahooSymbol(symbol: string): string {
  if (symbol.startsWith('BIST:')) return `${symbol.split(':')[1]}.IS`;
  if (symbol === 'XU100' || symbol === 'BIST:XU100') return 'XU100.IS';
  const map: Record<string, string> = {
    XAUUSD: 'GC=F',
    XAGUSD: 'SI=F',
    GOLD: 'GC=F',
    SILVER: 'SI=F',
    USOIL: 'CL=F',
    BRENT: 'BZ=F',
    NATGAS: 'NG=F',
    EURUSD: 'EURUSD=X',
    GBPUSD: 'GBPUSD=X',
    USDTRY: 'USDTRY=X',
  };
  if (map[symbol]) return map[symbol];
  if (symbol.includes(':')) return symbol.split(':')[1];
  return symbol;
}

export class YahooProvider implements MarketProvider {
  readonly id = 'yahoo';
  readonly name = 'Yahoo Finance (unofficial, delayed fallback)';
  readonly isRealtime = false;
  readonly experimental = true;
  readonly categories: MarketCategory[] = ['us_stock', 'forex', 'commodity', 'bist', 'index'];

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    throw new Error('yahoo: no streaming support, this is a REST-only fallback provider');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  async getQuote(symbol: string): Promise<Quote | null> {
    const ySymbol = toYahooSymbol(symbol);
    const res = await fetch(`${CHART_BASE}/${encodeURIComponent(ySymbol)}?interval=1d&range=1d`, {
      headers: { 'User-Agent': UA },
    });
    if (!res.ok) return null;
    const j = await res.json();
    const result = j?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? null;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null;
    const change = price !== null && prevClose !== null ? price - prevClose : null;
    const changePercent = change !== null && prevClose ? (change / prevClose) * 100 : null;
    return {
      symbol,
      price,
      change,
      changePercent,
      volume: meta.regularMarketVolume ?? null,
      timestamp: meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now(),
      provider: this.id,
      delayed: true,
      experimental: true,
    };
  }

  async getCandles(symbol: string, interval: CandleInterval): Promise<Candle[]> {
    const ySymbol = toYahooSymbol(symbol);
    const { interval: yInterval, range } = INTERVAL_MAP[interval];
    const res = await fetch(
      `${CHART_BASE}/${encodeURIComponent(ySymbol)}?interval=${yInterval}&range=${range}`,
      { headers: { 'User-Agent': UA } },
    );
    if (!res.ok) return [];
    const j = await res.json();
    const result = j?.chart?.result?.[0];
    if (!result) return [];
    const timestamps: number[] = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0] ?? {};
    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.close?.[i] == null) continue;
      candles.push({
        time: timestamps[i],
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
        volume: quote.volume?.[i] ?? 0,
      });
    }
    return candles;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await fetch(`${CHART_BASE}/AAPL?interval=1d&range=1d`, {
        headers: { 'User-Agent': UA },
      });
      const latencyMs = Date.now() - start;
      return {
        provider: this.id,
        healthy: res.ok,
        latencyMs,
        message: res.ok ? 'OK (unofficial, delayed)' : `HTTP ${res.status}`,
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
