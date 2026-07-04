import type { SymbolDef } from './symbols.js';
import type { MarketCategory } from './providers/market-provider.interface.js';
import { FmpProvider } from './providers/fmp.provider.js';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const fmp = new FmpProvider();

/** FMP's search-symbol endpoint (US stocks/ETFs) -- a no-op returning []
 * when FMP_API_KEY isn't set, so this is always safe to include. */
async function lookupFmp(query: string, limit: number): Promise<SymbolDef[]> {
  const matches = await fmp.searchSymbol(query, limit);
  return matches.map((m) => ({
    symbol: m.symbol,
    category: 'us_stock' as MarketCategory,
    displayName: m.name,
    displayNameTr: m.name,
  }));
}

/** Checks whether `${query}USDT` is a real, currently-traded Binance pair
 * by hitting the live ticker endpoint -- never fabricates a symbol. */
async function lookupBinance(query: string): Promise<SymbolDef | null> {
  const base = query.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!base) return null;
  const candidate = `${base}USDT`;
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${candidate}`);
    if (!res.ok) return null;
    const j = (await res.json()) as { symbol?: string; price?: string };
    if (!j.symbol || j.price === undefined) return null;
    return {
      symbol: `BINANCE:${j.symbol}`,
      binanceSymbol: j.symbol,
      category: 'crypto',
      displayName: base,
      displayNameTr: base,
    };
  } catch {
    return null;
  }
}

const YAHOO_QUOTE_TYPE_MAP: Record<string, MarketCategory> = {
  EQUITY: 'us_stock',
  ETF: 'etf',
  INDEX: 'index',
  CRYPTOCURRENCY: 'crypto',
  CURRENCY: 'forex',
  FUTURE: 'commodity',
  MUTUALFUND: 'etf',
};

interface YahooSearchQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  exchange?: string;
}

/** Searches Yahoo Finance's unofficial autocomplete endpoint for a real,
 * currently-listed instrument matching the query. Delayed/unofficial --
 * only used to discover *that a symbol exists*, not as the primary quote
 * source (getQuoteWithFallback still applies the normal provider chain). */
async function lookupYahoo(query: string, limit: number): Promise<SymbolDef[]> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=${limit}&newsCount=0`,
      { headers: { 'User-Agent': UA } },
    );
    if (!res.ok) return [];
    const j = (await res.json()) as { quotes?: YahooSearchQuote[] };
    const quotes = j.quotes ?? [];
    const results: SymbolDef[] = [];
    for (const q of quotes) {
      if (!q.symbol || !q.quoteType) continue;
      const category = YAHOO_QUOTE_TYPE_MAP[q.quoteType];
      if (!category) continue;
      const name = q.shortname ?? q.longname ?? q.symbol;
      const isBist = q.exchange === 'IST' || q.symbol.endsWith('.IS');
      results.push({
        symbol: category === 'crypto' ? `YAHOO:${q.symbol}` : isBist ? `BIST:${q.symbol.replace('.IS', '')}` : q.symbol,
        yahooSymbol: q.symbol,
        category: isBist ? 'bist' : category,
        displayName: name,
        displayNameTr: name,
      });
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Best-effort dynamic symbol discovery for a search query that has no
 * local catalog match. Tries Binance first (fast, exact, real-time-
 * capable), then Yahoo's search index (broad coverage, delayed). Never
 * invents a symbol or price -- every result here corresponds to a real,
 * currently-listed instrument confirmed live against the provider.
 */
export async function dynamicSymbolLookup(query: string, limit = 8): Promise<SymbolDef[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const [binanceMatch, yahooMatches, fmpMatches] = await Promise.all([
    lookupBinance(trimmed),
    lookupYahoo(trimmed, limit),
    lookupFmp(trimmed, limit),
  ]);

  const results: SymbolDef[] = [];
  const seen = new Set<string>();
  if (binanceMatch) {
    results.push(binanceMatch);
    seen.add(binanceMatch.symbol);
  }
  for (const m of [...yahooMatches, ...fmpMatches]) {
    if (seen.has(m.symbol)) continue;
    seen.add(m.symbol);
    results.push(m);
    if (results.length >= limit) break;
  }
  return results;
}
