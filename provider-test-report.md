# Provider Test Report

Generated: 2026-07-03T20:02:31.842Z

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
- Health: OK (982ms) — OK

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62223.99 | 983ms |
| BINANCE:ETHUSDT | OK | 1746.72 | 644ms |
| BINANCE:SOLUSDT | OK | 82.54 | 456ms |

## TradingView (twc-style quote session) (`tradingview-twc`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (769ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62224 | 278ms |
| BINANCE:ETHUSDT | OK | 1746.72 | 379ms |
| BINANCE:SOLUSDT | OK | 82.54 | 397ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14366 | 467ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33532 | 565ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.8005 | 319ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 565ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 505ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 268ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 418ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 409ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 711ms |
| NATGAS | OK | 3.22 | 371ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 330ms |
| BIST:THYAO | OK | 334 | 358ms |
| BIST:ASELS | OK | 399.5 | 308ms |
| BIST:KCHOL | OK | 189.6 | 270ms |
| BIST:SISE | OK | 44.34 | 380ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 261ms |
| TSLA | OK | 393.45 | 308ms |
| NVDA | OK | 194.83 | 610ms |
| MSFT | OK | 390.49 | 591ms |
| SPY | OK | 744.78 | 482ms |
| QQQ | OK | 712.6 | 189ms |

## TradingView (OHLCV microservice-style) (`tradingview-microservice`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (6487ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62210 | 6011ms |
| BINANCE:ETHUSDT | OK | 1745.79 | 6007ms |
| BINANCE:SOLUSDT | OK | 82.45 | 6008ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14352 | 6007ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33529 | 6014ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.7977 | 6002ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 6007ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 6009ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 6007ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 6012ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 6012ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 6008ms |
| NATGAS | OK | 3.22 | 6014ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 6015ms |
| BIST:THYAO | OK | 334 | 6006ms |
| BIST:ASELS | OK | 399.5 | 6005ms |
| BIST:KCHOL | OK | 189.6 | 6005ms |
| BIST:SISE | OK | 44.34 | 6003ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.27 | 6006ms |
| TSLA | OK | 393.24 | 6011ms |
| NVDA | OK | 194.69 | 6005ms |
| MSFT | OK | 389.83 | 6003ms |
| SPY | OK | 745.2 | 6011ms |
| QQQ | OK | 712.7 | 6011ms |

## TradingView (quote+candle client-style) (`tradingview-ws-client`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (293ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62194.86 | 162ms |
| BINANCE:ETHUSDT | OK | 1744.27 | 141ms |
| BINANCE:SOLUSDT | OK | 82.39 | 147ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14352 | 154ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33532 | 182ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.7981 | 168ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 169ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 144ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 150ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 156ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 190ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 182ms |
| NATGAS | OK | 3.22 | 161ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 157ms |
| BIST:THYAO | OK | 334 | 234ms |
| BIST:ASELS | OK | 399.5 | 181ms |
| BIST:KCHOL | OK | 189.6 | 175ms |
| BIST:SISE | OK | 44.34 | 159ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 160ms |
| TSLA | OK | 393.45 | 155ms |
| NVDA | OK | 194.83 | 145ms |
| MSFT | OK | 390.49 | 162ms |
| SPY | OK | 744.78 | 169ms |
| QQQ | OK | 712.6 | 232ms |

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
- Health: OK (438ms) — OK (unofficial, delayed)

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 249ms |
| TSLA | OK | 393.45 | 221ms |
| NVDA | OK | 194.83 | 180ms |
| MSFT | OK | 390.49 | 131ms |
| SPY | OK | 744.78 | 442ms |
| QQQ | OK | 712.6 | 731ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD | OK | 1.1439 | 440ms |
| GBPUSD | OK | 1.3354 | 115ms |
| USDTRY | OK | 46.7938 | 207ms |
| XAUUSD | OK | 4187.3 | 142ms |
| XAGUSD | OK | 62.815 | 113ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD | OK | 4187.3 | 89ms |
| SILVER | OK | 62.815 | 87ms |
| USOIL | OK | 68.78 | 192ms |
| BRENT | OK | 72.13 | 166ms |
| NATGAS | OK | 3.245 | 136ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 134ms |
| BIST:THYAO | OK | 334 | 159ms |
| BIST:ASELS | OK | 399.5 | 153ms |
| BIST:KCHOL | OK | 189.6 | 156ms |
| BIST:SISE | OK | 44.34 | 162ms |

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
