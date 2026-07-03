import type { Candle } from '../providers/market-provider.interface.js';

/** Pure technical-indicator functions over OHLCV candle series. No I/O, no
 * caching -- callers decide how fresh the candles need to be. All return
 * `null` where there isn't enough history yet, rather than a misleading 0. */

export function sma(candles: Candle[], period: number): number | null {
  if (candles.length < period) return null;
  const slice = candles.slice(-period);
  return slice.reduce((sum, c) => sum + c.close, 0) / period;
}

export function ema(candles: Candle[], period: number): number | null {
  if (candles.length < period) return null;
  const k = 2 / (period + 1);
  const seed = candles.slice(0, period).reduce((sum, c) => sum + c.close, 0) / period;
  let value = seed;
  for (const c of candles.slice(period)) {
    value = c.close * k + value * (1 - k);
  }
  return value;
}

/** Wilder's RSI (the standard used by every charting platform). */
export function rsi(candles: Candle[], period = 14): number | null {
  if (candles.length < period + 1) return null;
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const delta = candles[i].close - candles[i - 1].close;
    if (delta >= 0) gainSum += delta;
    else lossSum -= delta;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  for (let i = period + 1; i < candles.length; i++) {
    const delta = candles[i].close - candles[i - 1].close;
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? -delta : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export interface MacdResult {
  macd: number;
  signal: number;
  histogram: number;
}

export function macd(candles: Candle[], fast = 12, slow = 26, signalPeriod = 9): MacdResult | null {
  if (candles.length < slow + signalPeriod) return null;
  const macdSeries: number[] = [];
  for (let i = slow; i <= candles.length; i++) {
    const window = candles.slice(0, i);
    const fastEma = ema(window, fast);
    const slowEma = ema(window, slow);
    if (fastEma === null || slowEma === null) continue;
    macdSeries.push(fastEma - slowEma);
  }
  if (macdSeries.length < signalPeriod) return null;
  // EMA of the MACD line itself, computed on the plain number series.
  const k = 2 / (signalPeriod + 1);
  let signal = macdSeries.slice(0, signalPeriod).reduce((s, v) => s + v, 0) / signalPeriod;
  for (const v of macdSeries.slice(signalPeriod)) signal = v * k + signal * (1 - k);
  const macdLine = macdSeries[macdSeries.length - 1];
  return { macd: macdLine, signal, histogram: macdLine - signal };
}

export interface BollingerResult {
  upper: number;
  middle: number;
  lower: number;
}

export function bollinger(candles: Candle[], period = 20, stdDevMultiplier = 2): BollingerResult | null {
  if (candles.length < period) return null;
  const slice = candles.slice(-period);
  const mean = slice.reduce((s, c) => s + c.close, 0) / period;
  const variance = slice.reduce((s, c) => s + (c.close - mean) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);
  return { upper: mean + stdDevMultiplier * stdDev, middle: mean, lower: mean - stdDevMultiplier * stdDev };
}

export interface IndicatorSnapshot {
  rsi14: number | null;
  sma20: number | null;
  sma50: number | null;
  macd: MacdResult | null;
  bollinger: BollingerResult | null;
}

export function computeIndicators(candles: Candle[]): IndicatorSnapshot {
  return {
    rsi14: rsi(candles, 14),
    sma20: sma(candles, 20),
    sma50: sma(candles, 50),
    macd: macd(candles),
    bollinger: bollinger(candles),
  };
}
