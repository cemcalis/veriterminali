# Provider Test Report

Generated: 2026-07-03T15:50:17.540Z

## Summary

| Provider | Realtime | Experimental | Health | API Key |
|---|---|---|---|---|
| Binance WebSocket (`binance`) | yes | no | OK — OK | not required |
| TradingView (twc-style quote session) (`tradingview-twc`) | yes | YES (unofficial) | OK — OK (experimental/unofficial) | not required |
| TradingView (OHLCV microservice-style) (`tradingview-microservice`) | yes | YES (unofficial) | OK — OK (experimental/unofficial) | not required |
| TradingView (quote+candle client-style) (`tradingview-ws-client`) | yes | YES (unofficial) | OK — OK (experimental/unofficial) | not required |
| StockerAPI / Kun Data (BIST, paid) (`stockerapi`) | yes | no | DOWN — NO FREE TIER: repo is a marketing shell for the paid Kun Data API (kun.pro). Requires STOCKERAPI_TOKEN. | required, MISSING |
| Finnhub (free tier) (`finnhub`) | no | no | DOWN — FINNHUB_API_KEY not set in .env (free tier key required, no cost) | required, MISSING |
| Twelve Data (free tier) (`twelvedata`) | no | no | DOWN — TWELVEDATA_API_KEY not set in .env (free tier key required, no cost) | required, MISSING |
| Yahoo Finance (unofficial, delayed fallback) (`yahoo`) | no | YES (unofficial) | OK — OK (unofficial, delayed) | not required |

## Binance WebSocket (`binance`)

- Realtime: true
- Experimental/unofficial: false
- Health: OK (1268ms) — OK

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 61913.82 | 838ms |
| BINANCE:ETHUSDT | OK | 1734.43 | 532ms |
| BINANCE:SOLUSDT | OK | 81.29 | 563ms |

## TradingView (twc-style quote session) (`tradingview-twc`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (1115ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 61913.82 | 421ms |
| BINANCE:ETHUSDT | OK | 1734.43 | 251ms |
| BINANCE:SOLUSDT | OK | 81.3 | 165ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14389 | 188ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33525 | 164ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.7994 | 150ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4167.985 | 238ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.3065 | 186ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4167.836 | 168ms |
| SILVER (as TVC:SILVER) | OK | 62.2932 | 161ms |
| USOIL (as TVC:USOIL) | OK | 68.67 | 149ms |
| BRENT (as BLACKBULL:BRENT) | OK | 71.985 | 222ms |
| NATGAS | OK | 3.216 | 194ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 250ms |
| BIST:THYAO | OK | 334 | 306ms |
| BIST:ASELS | OK | 399.5 | 301ms |
| BIST:KCHOL | OK | 189.6 | 228ms |
| BIST:SISE | OK | 44.34 | 166ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 208ms |
| TSLA | OK | 393.45 | 178ms |
| NVDA | OK | 194.83 | 184ms |
| MSFT | OK | 390.49 | 168ms |
| SPY | OK | 744.78 | 190ms |
| QQQ | OK | 712.6 | 254ms |

## TradingView (OHLCV microservice-style) (`tradingview-microservice`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (7471ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 61850.01 | 6001ms |
| BINANCE:ETHUSDT | OK | 1733.33 | 6003ms |
| BINANCE:SOLUSDT | OK | 81.26 | 6008ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14387 | 6008ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33526 | 6003ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.7966 | 6014ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4168.525 | 6006ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.339 | 6000ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4168.841 | 6014ms |
| SILVER (as TVC:SILVER) | OK | 62.3262 | 6014ms |
| USOIL (as TVC:USOIL) | OK | 68.7 | 6005ms |
| BRENT (as BLACKBULL:BRENT) | OK | 71.995 | 6009ms |
| NATGAS | OK | 3.217 | 6003ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 6013ms |
| BIST:THYAO | OK | 334 | 6006ms |
| BIST:ASELS | OK | 399.5 | 6013ms |
| BIST:KCHOL | OK | 189.6 | 6013ms |
| BIST:SISE | OK | 44.34 | 6000ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.27 | 6011ms |
| TSLA | OK | 393.24 | 6008ms |
| NVDA | OK | 194.69 | 6010ms |
| MSFT | OK | 389.83 | 6002ms |
| SPY | OK | 745.2 | 6003ms |
| QQQ | OK | 712.7 | 6014ms |

## TradingView (quote+candle client-style) (`tradingview-ws-client`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (613ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 61845.39 | 944ms |
| BINANCE:ETHUSDT | OK | 1732.79 | 440ms |
| BINANCE:SOLUSDT | OK | 81.2 | 381ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14392 | 444ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33534 | 599ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.7992 | 705ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4168.6 | 639ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.3305 | 429ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4168.44 | 470ms |
| SILVER (as TVC:SILVER) | OK | 62.3152 | 442ms |
| USOIL (as TVC:USOIL) | OK | 68.7 | 474ms |
| BRENT (as BLACKBULL:BRENT) | OK | 71.985 | 427ms |
| NATGAS | OK | 3.218 | 416ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 352ms |
| BIST:THYAO | OK | 334 | 264ms |
| BIST:ASELS | OK | 399.5 | 185ms |
| BIST:KCHOL | OK | 189.6 | 189ms |
| BIST:SISE | OK | 44.34 | 244ms |

### us_stock (5/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 397ms |
| TSLA | OK | 393.45 | 341ms |
| NVDA | OK | 194.83 | 576ms |
| MSFT | OK | 390.49 | 328ms |
| SPY | FAIL: timeout 8s | - | 8009ms |
| QQQ | OK | 712.6 | 6138ms |

## StockerAPI / Kun Data (BIST, paid) (`stockerapi`)

- Realtime: true
- Experimental/unofficial: false
- Health: DOWN (n/ams) — NO FREE TIER: repo is a marketing shell for the paid Kun Data API (kun.pro). Requires STOCKERAPI_TOKEN.

### bist (0/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | FAIL: no price returned | - | 0ms |
| BIST:THYAO | FAIL: no price returned | - | 0ms |
| BIST:ASELS | FAIL: no price returned | - | 0ms |
| BIST:KCHOL | FAIL: no price returned | - | 0ms |
| BIST:SISE | FAIL: no price returned | - | 0ms |

## Finnhub (free tier) (`finnhub`)

- Realtime: false
- Experimental/unofficial: false
- Health: DOWN (n/ams) — FINNHUB_API_KEY not set in .env (free tier key required, no cost)

### us_stock (0/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | FAIL: no price returned | - | 1ms |
| TSLA | FAIL: no price returned | - | 0ms |
| NVDA | FAIL: no price returned | - | 0ms |
| MSFT | FAIL: no price returned | - | 0ms |
| SPY | FAIL: no price returned | - | 0ms |
| QQQ | FAIL: no price returned | - | 0ms |

### forex (0/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD | FAIL: no price returned | - | 0ms |
| GBPUSD | FAIL: no price returned | - | 0ms |
| USDTRY | FAIL: no price returned | - | 0ms |
| XAUUSD | FAIL: no price returned | - | 0ms |
| XAGUSD | FAIL: no price returned | - | 0ms |

### crypto (0/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | FAIL: no price returned | - | 0ms |
| BINANCE:ETHUSDT | FAIL: no price returned | - | 0ms |
| BINANCE:SOLUSDT | FAIL: no price returned | - | 0ms |

## Twelve Data (free tier) (`twelvedata`)

- Realtime: false
- Experimental/unofficial: false
- Health: DOWN (n/ams) — TWELVEDATA_API_KEY not set in .env (free tier key required, no cost)

### us_stock (0/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | FAIL: no price returned | - | 0ms |
| TSLA | FAIL: no price returned | - | 0ms |
| NVDA | FAIL: no price returned | - | 0ms |
| MSFT | FAIL: no price returned | - | 0ms |
| SPY | FAIL: no price returned | - | 0ms |
| QQQ | FAIL: no price returned | - | 0ms |

### forex (0/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD | FAIL: no price returned | - | 0ms |
| GBPUSD | FAIL: no price returned | - | 0ms |
| USDTRY | FAIL: no price returned | - | 0ms |
| XAUUSD | FAIL: no price returned | - | 0ms |
| XAGUSD | FAIL: no price returned | - | 0ms |

### commodity (0/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD | FAIL: no price returned | - | 0ms |
| SILVER | FAIL: no price returned | - | 0ms |
| USOIL | FAIL: no price returned | - | 0ms |
| BRENT | FAIL: no price returned | - | 0ms |
| NATGAS | FAIL: no price returned | - | 0ms |

### crypto (0/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | FAIL: no price returned | - | 0ms |
| BINANCE:ETHUSDT | FAIL: no price returned | - | 0ms |
| BINANCE:SOLUSDT | FAIL: no price returned | - | 0ms |

## Yahoo Finance (unofficial, delayed fallback) (`yahoo`)

- Realtime: false
- Experimental/unofficial: true
- Health: OK (2826ms) — OK (unofficial, delayed)

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 2903ms |
| TSLA | OK | 393.45 | 2232ms |
| NVDA | OK | 194.83 | 1005ms |
| MSFT | OK | 390.49 | 540ms |
| SPY | OK | 744.78 | 375ms |
| QQQ | OK | 712.6 | 1050ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD | OK | 1.1443 | 1640ms |
| GBPUSD | OK | 1.3354 | 1341ms |
| USDTRY | OK | 46.7979 | 2416ms |
| XAUUSD | OK | 4179.9 | 1679ms |
| XAGUSD | OK | 62.745 | 769ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD | OK | 4179.9 | 2153ms |
| SILVER | OK | 62.725 | 901ms |
| USOIL | OK | 68.77 | 165ms |
| BRENT | OK | 72.09 | 120ms |
| NATGAS | OK | 3.237 | 299ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 385ms |
| BIST:THYAO | OK | 334 | 500ms |
| BIST:ASELS | OK | 399.5 | 469ms |
| BIST:KCHOL | OK | 189.6 | 500ms |
| BIST:SISE | OK | 44.34 | 459ms |

## Conclusions & Recommended Routing

- Official realtime sources that work: binance
- Experimental/unofficial realtime sources that work: tradingview-twc, tradingview-microservice, tradingview-ws-client
- Delayed/fallback sources that work: yahoo

Recommended routing implemented in `provider-registry.ts`:
1. Crypto -> `binance` (official, free, true realtime, no key)
2. Forex/commodities/BIST/US stocks/indices -> `tradingview-twc` (experimental unofficial feed, true realtime, no key) as primary since it is the only source with full free coverage of all these markets
3. If TradingView unofficial feed is unavailable -> `finnhub` / `twelvedata` if API keys are configured (delayed/polling)
4. Final fallback -> `yahoo` (unofficial, delayed, no key)
5. `stockerapi` is disabled by default: the repo has no free tier, it is a paid product shell
