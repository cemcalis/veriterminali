# Provider Coverage Report

Generated: 2026-07-03T18:30:53.183Z

**Total symbols in catalog: 1149**

## Summary by category

| Category | Total | Working | Failed | Primary provider | Status |
|---|---|---|---|---|---|
| Crypto | 400 | 400 | 0 | binance (official WS) | live |
| Forex | 56 | ~56 | ~0 | tradingview-twc (experimental) | near-live (sampled) |
| Commodities | 23 | ~21 | ~2 | tradingview-twc (experimental) | near-live (sampled) |
| BIST (Turkish equities) | 199 | ~199 | ~0 | tradingview-twc (experimental) | near-live (sampled) |
| US Stocks | 381 | ~381 | ~0 | tradingview-twc (experimental) | near-live (sampled) |
| ETFs | 67 | ~67 | ~0 | tradingview-twc (experimental) | near-live (sampled) |
| Global Indices | 23 | ~23 | ~0 | tradingview-twc (experimental) | near-live (sampled) |

> Non-crypto rows are extrapolated from a live concurrent sample of the first 10 symbols per category (checked against the unofficial TradingView feed, then Yahoo Finance as delayed fallback) — probing all ~750 non-crypto symbols individually against the unofficial per-symbol TradingView protocol is too slow to run on every regeneration. Crypto is checked exhaustively via a single batched Binance request.

## Provider status legend

- **live** — official, true real-time push feed (Binance WebSocket)
- **near-live** — unofficial/reverse-engineered real-time feed (TradingView), no official SLA
- **delayed** — REST polling / delayed data (Yahoo Finance, Finnhub/TwelveData free tiers)
- **fallback** — data returned but tick is stale beyond the freshness window
- **unavailable** — no provider currently returns data for this symbol
