import type { MarketCategory } from './providers/market-provider.interface.js';

export interface SymbolDef {
  /** canonical id used across the app and as the TradingView-adapter symbol */
  symbol: string;
  /** symbol as used by Binance (crypto only) */
  binanceSymbol?: string;
  /** symbol as used by Yahoo Finance fallback */
  yahooSymbol?: string;
  category: MarketCategory;
  displayName: string;
  displayNameTr: string;
}

export const SYMBOL_CATALOG: SymbolDef[] = [
  // Crypto
  { symbol: 'BINANCE:BTCUSDT', binanceSymbol: 'BTCUSDT', category: 'crypto', displayName: 'Bitcoin', displayNameTr: 'Bitcoin' },
  { symbol: 'BINANCE:ETHUSDT', binanceSymbol: 'ETHUSDT', category: 'crypto', displayName: 'Ethereum', displayNameTr: 'Ethereum' },
  { symbol: 'BINANCE:SOLUSDT', binanceSymbol: 'SOLUSDT', category: 'crypto', displayName: 'Solana', displayNameTr: 'Solana' },

  // Forex
  { symbol: 'FX:EURUSD', yahooSymbol: 'EURUSD', category: 'forex', displayName: 'EUR/USD', displayNameTr: 'EUR/USD' },
  { symbol: 'FX:GBPUSD', yahooSymbol: 'GBPUSD', category: 'forex', displayName: 'GBP/USD', displayNameTr: 'GBP/USD' },
  { symbol: 'FX_IDC:USDTRY', yahooSymbol: 'USDTRY', category: 'forex', displayName: 'USD/TRY', displayNameTr: 'USD/TRY' },
  { symbol: 'OANDA:XAUUSD', yahooSymbol: 'XAUUSD', category: 'forex', displayName: 'Gold Spot (XAU/USD)', displayNameTr: 'Altın Spot (XAU/USD)' },
  { symbol: 'OANDA:XAGUSD', yahooSymbol: 'XAGUSD', category: 'forex', displayName: 'Silver Spot (XAG/USD)', displayNameTr: 'Gümüş Spot (XAG/USD)' },

  // Commodities
  { symbol: 'TVC:GOLD', yahooSymbol: 'GOLD', category: 'commodity', displayName: 'Gold Futures', displayNameTr: 'Altın Vadeli' },
  { symbol: 'TVC:SILVER', yahooSymbol: 'SILVER', category: 'commodity', displayName: 'Silver Futures', displayNameTr: 'Gümüş Vadeli' },
  { symbol: 'TVC:USOIL', yahooSymbol: 'USOIL', category: 'commodity', displayName: 'WTI Crude Oil', displayNameTr: 'WTI Ham Petrol' },
  { symbol: 'BLACKBULL:BRENT', yahooSymbol: 'BRENT', category: 'commodity', displayName: 'Brent Crude Oil', displayNameTr: 'Brent Ham Petrol' },
  { symbol: 'NATGAS', yahooSymbol: 'NATGAS', category: 'commodity', displayName: 'Natural Gas', displayNameTr: 'Doğal Gaz' },

  // BIST
  { symbol: 'BIST:XU100', yahooSymbol: 'BIST:XU100', category: 'bist', displayName: 'BIST 100', displayNameTr: 'BIST 100' },
  { symbol: 'BIST:THYAO', yahooSymbol: 'BIST:THYAO', category: 'bist', displayName: 'Turkish Airlines', displayNameTr: 'Türk Hava Yolları' },
  { symbol: 'BIST:ASELS', yahooSymbol: 'BIST:ASELS', category: 'bist', displayName: 'Aselsan', displayNameTr: 'Aselsan' },
  { symbol: 'BIST:KCHOL', yahooSymbol: 'BIST:KCHOL', category: 'bist', displayName: 'Koç Holding', displayNameTr: 'Koç Holding' },
  { symbol: 'BIST:SISE', yahooSymbol: 'BIST:SISE', category: 'bist', displayName: 'Şişecam', displayNameTr: 'Şişecam' },

  // US stocks
  { symbol: 'AAPL', yahooSymbol: 'AAPL', category: 'us_stock', displayName: 'Apple', displayNameTr: 'Apple' },
  { symbol: 'TSLA', yahooSymbol: 'TSLA', category: 'us_stock', displayName: 'Tesla', displayNameTr: 'Tesla' },
  { symbol: 'NVDA', yahooSymbol: 'NVDA', category: 'us_stock', displayName: 'NVIDIA', displayNameTr: 'NVIDIA' },
  { symbol: 'MSFT', yahooSymbol: 'MSFT', category: 'us_stock', displayName: 'Microsoft', displayNameTr: 'Microsoft' },
  { symbol: 'SPY', yahooSymbol: 'SPY', category: 'index', displayName: 'S&P 500 ETF', displayNameTr: 'S&P 500 ETF' },
  { symbol: 'QQQ', yahooSymbol: 'QQQ', category: 'index', displayName: 'Nasdaq 100 ETF', displayNameTr: 'Nasdaq 100 ETF' },
];

export function findSymbol(symbol: string): SymbolDef | undefined {
  return SYMBOL_CATALOG.find((s) => s.symbol === symbol);
}

export function symbolsByCategory(category: MarketCategory): SymbolDef[] {
  return SYMBOL_CATALOG.filter((s) => s.category === category);
}
