# Provider Test Report

Generated: 2026-07-03T18:35:10.734Z

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
- Health: OK (675ms) — OK

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62193 | 528ms |
| BINANCE:ETHUSDT | OK | 1738.54 | 306ms |
| BINANCE:SOLUSDT | OK | 81.81 | 410ms |

## TradingView (twc-style quote session) (`tradingview-twc`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (375ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62193 | 159ms |
| BINANCE:ETHUSDT | OK | 1738.54 | 150ms |
| BINANCE:SOLUSDT | OK | 81.81 | 149ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14394 | 146ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.3356 | 151ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.799 | 138ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 224ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 132ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 130ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 120ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 130ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 165ms |
| NATGAS | OK | 3.22 | 125ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 157ms |
| BIST:THYAO | OK | 334 | 163ms |
| BIST:ASELS | OK | 399.5 | 277ms |
| BIST:KCHOL | OK | 189.6 | 165ms |
| BIST:SISE | OK | 44.34 | 153ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 265ms |
| TSLA | OK | 393.45 | 210ms |
| NVDA | OK | 194.83 | 100ms |
| MSFT | OK | 390.49 | 234ms |
| SPY | OK | 744.78 | 226ms |
| QQQ | OK | 712.6 | 262ms |

## TradingView (OHLCV microservice-style) (`tradingview-microservice`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (6397ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62196 | 6001ms |
| BINANCE:ETHUSDT | OK | 1738.87 | 6003ms |
| BINANCE:SOLUSDT | OK | 81.82 | 6004ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14392 | 6007ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33563 | 6008ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.7978 | 6010ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 6006ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 6003ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 6001ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 6013ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 6008ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 6008ms |
| NATGAS | OK | 3.22 | 6004ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 6007ms |
| BIST:THYAO | OK | 334 | 6008ms |
| BIST:ASELS | OK | 399.5 | 6006ms |
| BIST:KCHOL | OK | 189.6 | 6013ms |
| BIST:SISE | OK | 44.34 | 6006ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.27 | 6004ms |
| TSLA | OK | 393.24 | 6002ms |
| NVDA | OK | 194.69 | 6007ms |
| MSFT | OK | 389.83 | 6016ms |
| SPY | OK | 745.2 | 6018ms |
| QQQ | OK | 712.7 | 6007ms |

## TradingView (quote+candle client-style) (`tradingview-ws-client`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (1032ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62206.01 | 176ms |
| BINANCE:ETHUSDT | OK | 1739.05 | 243ms |
| BINANCE:SOLUSDT | OK | 81.82 | 193ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14394 | 239ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33564 | 275ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.7992 | 419ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 629ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 311ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 275ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 207ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 210ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 154ms |
| NATGAS | OK | 3.22 | 299ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 130ms |
| BIST:THYAO | OK | 334 | 259ms |
| BIST:ASELS | OK | 399.5 | 209ms |
| BIST:KCHOL | OK | 189.6 | 149ms |
| BIST:SISE | OK | 44.34 | 160ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 149ms |
| TSLA | OK | 393.45 | 117ms |
| NVDA | OK | 194.83 | 169ms |
| MSFT | OK | 390.49 | 160ms |
| SPY | OK | 744.78 | 165ms |
| QQQ | OK | 712.6 | 149ms |

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
- Health: OK (602ms) — OK (unofficial, delayed)

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 447ms |
| TSLA | OK | 393.45 | 326ms |
| NVDA | OK | 194.83 | 163ms |
| MSFT | OK | 390.49 | 115ms |
| SPY | OK | 744.78 | 135ms |
| QQQ | OK | 712.6 | 81ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD | OK | 1.1443 | 109ms |
| GBPUSD | OK | 1.3357 | 135ms |
| USDTRY | OK | 46.7981 | 124ms |
| XAUUSD | OK | 4187.3 | 113ms |
| XAGUSD | OK | 62.815 | 185ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD | OK | 4187.3 | 77ms |
| SILVER | OK | 62.815 | 85ms |
| USOIL | OK | 68.78 | 88ms |
| BRENT | OK | 72.13 | 117ms |
| NATGAS | OK | 3.245 | 132ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 129ms |
| BIST:THYAO | OK | 334 | 132ms |
| BIST:ASELS | OK | 399.5 | 156ms |
| BIST:KCHOL | OK | 189.6 | 171ms |
| BIST:SISE | OK | 44.34 | 214ms |

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
