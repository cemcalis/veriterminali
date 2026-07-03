'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import { api } from '@/lib/api';
import { useMarketStore } from '@/lib/store';
import type { CandleInterval } from '@/lib/types';

const INTERVALS: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

export function ChartPanel({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [interval, setInterval] = useState<CandleInterval>('5m');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ provider: string; experimental: boolean } | null>(null);
  const debugMode = useMarketStore((s) => s.debugMode);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#12121a' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#23232f' }, horzLines: { color: '#23232f' } },
      width: containerRef.current.clientWidth,
      height: 360,
      timeScale: { timeVisible: true, secondsVisible: false },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const onResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .candles(symbol, interval)
      .then((res) => {
        if (cancelled) return;
        seriesRef.current?.setData(
          res.candles.map((c) => ({ time: c.time as never, open: c.open, high: c.high, low: c.low, close: c.close })),
        );
        setMeta({ provider: res.provider, experimental: res.experimental });
        chartRef.current?.timeScale().fitContent();
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Grafik yüklenemedi');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, interval]);

  return (
    <div className="panel p-2">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex gap-1">
          {INTERVALS.map((tf) => (
            <button
              key={tf}
              onClick={() => setInterval(tf)}
              className={`px-2 py-1 rounded text-xs ${
                interval === tf ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        {debugMode && meta && (
          <span className="text-[10px] text-slate-500">
            {meta.provider}
            {meta.experimental ? ' · deneysel' : ''}
          </span>
        )}
      </div>
      <div ref={containerRef} className="w-full" />
      {loading && <div className="text-center text-xs text-slate-500 py-2">Yükleniyor…</div>}
      {error && <div className="text-center text-xs text-red-400 py-2">{error}</div>}
    </div>
  );
}
