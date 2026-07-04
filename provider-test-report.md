# Provider Test Report

Generated: 2026-07-04T15:10:43.612Z

## Summary

| Provider | Realtime | Experimental | Health | API Key |
|---|---|---|---|---|
| Binance WebSocket (`binance`) | yes | no | OK — OK | not required |
| TradingView (twc-style quote session) (`tradingview-twc`) | yes | YES (unofficial) | OK — OK (experimental/unofficial) | not required |
| TradingView (OHLCV microservice-style) (`tradingview-microservice`) | yes | YES (unofficial) | OK — OK (experimental/unofficial) | not required |
| TradingView (quote+candle client-style) (`tradingview-ws-client`) | yes | YES (unofficial) | OK — OK (experimental/unofficial) | not required |
| StockerAPI / Kun Data (BIST, paid) (`stockerapi`) | yes | no | DOWN — NO FREE TIER: repo is a marketing shell for the paid Kun Data API (kun.pro). Requires STOCKERAPI_TOKEN. | required, MISSING |
| Finnhub (free tier, real-time trade WS) (`finnhub`) | yes | no | DOWN — FINNHUB_API_KEY not set in .env (free tier key required, no cost) | required, MISSING |
| Twelve Data (free tier) (`twelvedata`) | no | no | DOWN — TWELVEDATA_API_KEY not set in .env (free tier key required, no cost) | required, MISSING |
| Financial Modeling Prep (free tier, REST-only) (`fmp`) | no | no | DOWN — FMP_API_KEY not set in .env (free tier key required, no cost) | required, MISSING |
| Alpha Vantage (free tier, 25 req/day -- last resort) (`alphavantage`) | no | no | DOWN — ALPHAVANTAGE_API_KEY not set (free, but capped at 25 requests/day -- last-resort fallback only) | required, MISSING |
| Polygon.io / Massive (no free tier as of 2026) (`polygon`) | no | no | DOWN — NO FREE TIER: Polygon/Massive discontinued its free/low-cost plans; a paid subscription is required | required, MISSING |
| ECB reference rates (via frankfurter.dev, free, daily) (`ecb`) | no | no | OK — OK (official ECB daily reference, not real-time) | not required |
| Bigpara / Hürriyet (public frontend JSON, unofficial, near-live BIST) (`bigpara`) | no | YES (unofficial) | DOWN — HTTP 401 | not required |
| İş Yatırım (public frontend JSON, unofficial, daily BIST OHLC) (`isyatirim`) | no | YES (unofficial) | OK — OK (unofficial public frontend endpoint, daily BIST OHLC history) | not required |
| TCMB EVDS (official Turkish Central Bank reference rates, free key, daily) (`tcmb-evds`) | no | no | DOWN — EVDS_API_KEY not set (free registration at evds2.tcmb.gov.tr, no cost, no card required) | required, MISSING |
| BiQuote (experimental, public unofficial MT5 feed, forex only, disabled by default) (`biquote`) | no | YES (unofficial) | DOWN — BIQUOTE_ENABLED=false (default) -- disabled pending clearer BIST/ToS transparency, see file header | not required |
| Yahoo Finance (unofficial, delayed fallback) (`yahoo`) | no | YES (unofficial) | OK — OK (unofficial, delayed) | not required |

## Binance WebSocket (`binance`)

- Realtime: true
- Experimental/unofficial: false
- Health: OK (765ms) — OK

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62706 | 460ms |
| BINANCE:ETHUSDT | OK | 1775.15 | 294ms |
| BINANCE:SOLUSDT | OK | 81.81 | 299ms |

## TradingView (twc-style quote session) (`tradingview-twc`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (305ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62706 | 155ms |
| BINANCE:ETHUSDT | OK | 1775.15 | 147ms |
| BINANCE:SOLUSDT | OK | 81.81 | 159ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14329 | 157ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33435 | 145ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.753 | 197ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 138ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 168ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 155ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 145ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 147ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 164ms |
| NATGAS | OK | 3.22 | 149ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 166ms |
| BIST:THYAO | OK | 334 | 154ms |
| BIST:ASELS | OK | 399.5 | 166ms |
| BIST:KCHOL | OK | 189.6 | 147ms |
| BIST:SISE | OK | 44.34 | 142ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 150ms |
| TSLA | OK | 393.45 | 145ms |
| NVDA | OK | 194.83 | 151ms |
| MSFT | OK | 390.49 | 145ms |
| SPY | OK | 744.78 | 151ms |
| QQQ | OK | 712.6 | 145ms |

## TradingView (OHLCV microservice-style) (`tradingview-microservice`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (6286ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62714 | 6004ms |
| BINANCE:ETHUSDT | OK | 1775.25 | 6000ms |
| BINANCE:SOLUSDT | OK | 81.81 | 6011ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14329 | 6013ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33435 | 6012ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.753 | 6002ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 6003ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 6004ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 6005ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 6006ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 6015ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 6006ms |
| NATGAS | OK | 3.22 | 6001ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 6009ms |
| BIST:THYAO | OK | 334 | 6002ms |
| BIST:ASELS | OK | 399.5 | 6016ms |
| BIST:KCHOL | OK | 189.6 | 6006ms |
| BIST:SISE | OK | 44.34 | 6005ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.27 | 6003ms |
| TSLA | OK | 393.24 | 6001ms |
| NVDA | OK | 194.69 | 6017ms |
| MSFT | OK | 389.83 | 6010ms |
| SPY | OK | 745.2 | 6015ms |
| QQQ | OK | 712.7 | 6002ms |

## TradingView (quote+candle client-style) (`tradingview-ws-client`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (416ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62978.02 | 150ms |
| BINANCE:ETHUSDT | OK | 1791.78 | 167ms |
| BINANCE:SOLUSDT | OK | 82.33 | 190ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14329 | 151ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33435 | 143ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.753 | 142ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 114ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 211ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 153ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 206ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 225ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 145ms |
| NATGAS | OK | 3.22 | 161ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 155ms |
| BIST:THYAO | OK | 334 | 149ms |
| BIST:ASELS | OK | 399.5 | 185ms |
| BIST:KCHOL | OK | 189.6 | 153ms |
| BIST:SISE | OK | 44.34 | 150ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 127ms |
| TSLA | OK | 393.45 | 167ms |
| NVDA | OK | 194.83 | 198ms |
| MSFT | OK | 390.49 | 150ms |
| SPY | OK | 744.78 | 147ms |
| QQQ | OK | 712.6 | 99ms |

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

## Finnhub (free tier, real-time trade WS) (`finnhub`)

- Realtime: true
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
| BINANCE:BTCUSDT | FAIL: no price returned | - | 1ms |
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

## Financial Modeling Prep (free tier, REST-only) (`fmp`)

- Realtime: false
- Experimental/unofficial: false
- Health: DOWN (n/ams) — FMP_API_KEY not set in .env (free tier key required, no cost)

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

## Alpha Vantage (free tier, 25 req/day -- last resort) (`alphavantage`)

- Realtime: false
- Experimental/unofficial: false
- Health: DOWN (n/ams) — ALPHAVANTAGE_API_KEY not set (free, but capped at 25 requests/day -- last-resort fallback only)

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

## Polygon.io / Massive (no free tier as of 2026) (`polygon`)

- Realtime: false
- Experimental/unofficial: false
- Health: DOWN (n/ams) — NO FREE TIER: Polygon/Massive discontinued its free/low-cost plans; a paid subscription is required

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

## ECB reference rates (via frankfurter.dev, free, daily) (`ecb`)

- Realtime: false
- Experimental/unofficial: false
- Health: OK (416ms) — OK (official ECB daily reference, not real-time)

### forex (3/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD | OK | 1.1448 | 354ms |
| GBPUSD | OK | 1.3355 | 94ms |
| USDTRY | OK | 46.805 | 154ms |
| XAUUSD | FAIL: no price returned | - | 156ms |
| XAGUSD | FAIL: no price returned | - | 180ms |

## Bigpara / Hürriyet (public frontend JSON, unofficial, near-live BIST) (`bigpara`)

- Realtime: false
- Experimental/unofficial: true
- Health: DOWN (248ms) — HTTP 401

### bist (3/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | FAIL: no price returned | - | 530ms |
| BIST:THYAO | OK | 334 | 51ms |
| BIST:ASELS | OK | 399.5 | 51ms |
| BIST:KCHOL | FAIL: no price returned | - | 42ms |
| BIST:SISE | OK | 44.34 | 51ms |

## İş Yatırım (public frontend JSON, unofficial, daily BIST OHLC) (`isyatirim`)

- Realtime: false
- Experimental/unofficial: true
- Health: OK (183ms) — OK (unofficial public frontend endpoint, daily BIST OHLC history)

### bist (4/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | FAIL: no price returned | - | 52ms |
| BIST:THYAO | OK | 334 | 56ms |
| BIST:ASELS | OK | 399.5 | 63ms |
| BIST:KCHOL | OK | 189.6 | 58ms |
| BIST:SISE | OK | 44.34 | 49ms |

## TCMB EVDS (official Turkish Central Bank reference rates, free key, daily) (`tcmb-evds`)

- Realtime: false
- Experimental/unofficial: false
- Health: DOWN (n/ams) — EVDS_API_KEY not set (free registration at evds2.tcmb.gov.tr, no cost, no card required)

### forex (0/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD | FAIL: no price returned | - | 0ms |
| GBPUSD | FAIL: no price returned | - | 0ms |
| USDTRY | FAIL: no price returned | - | 0ms |
| XAUUSD | FAIL: no price returned | - | 0ms |
| XAGUSD | FAIL: no price returned | - | 0ms |

## BiQuote (experimental, public unofficial MT5 feed, forex only, disabled by default) (`biquote`)

- Realtime: false
- Experimental/unofficial: true
- Health: DOWN (n/ams) — BIQUOTE_ENABLED=false (default) -- disabled pending clearer BIST/ToS transparency, see file header

### forex (0/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD | FAIL: no price returned | - | 0ms |
| GBPUSD | FAIL: no price returned | - | 0ms |
| USDTRY | FAIL: no price returned | - | 0ms |
| XAUUSD | FAIL: no price returned | - | 0ms |
| XAGUSD | FAIL: no price returned | - | 0ms |

## Yahoo Finance (unofficial, delayed fallback) (`yahoo`)

- Realtime: false
- Experimental/unofficial: true
- Health: OK (464ms) — OK (unofficial, delayed)

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 324ms |
| TSLA | OK | 393.45 | 112ms |
| NVDA | OK | 194.83 | 179ms |
| MSFT | OK | 390.49 | 109ms |
| SPY | OK | 744.78 | 200ms |
| QQQ | OK | 712.6 | 205ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD | OK | 1.144 | 118ms |
| GBPUSD | OK | 1.335 | 113ms |
| USDTRY | OK | 46.753 | 115ms |
| XAUUSD | OK | 4187.3 | 125ms |
| XAGUSD | OK | 62.815 | 114ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD | OK | 4187.3 | 75ms |
| SILVER | OK | 62.815 | 76ms |
| USOIL | OK | 68.78 | 74ms |
| BRENT | OK | 72.13 | 75ms |
| NATGAS | OK | 3.245 | 75ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 170ms |
| BIST:THYAO | OK | 334 | 140ms |
| BIST:ASELS | OK | 399.5 | 155ms |
| BIST:KCHOL | OK | 189.6 | 225ms |
| BIST:SISE | OK | 44.34 | 297ms |

## Conclusions & Recommended Routing

- Official realtime sources that work: binance
- Experimental/unofficial realtime sources that work: tradingview-twc, tradingview-microservice, tradingview-ws-client
- Delayed/fallback sources that work: ecb, isyatirim, yahoo

Recommended routing implemented in `provider-registry.ts`:
1. Crypto -> `binance` (official, free, true realtime, no key)
2. Forex/commodities/BIST/US stocks/indices -> `tradingview-twc` (experimental unofficial feed, true realtime, no key) as primary since it is the only source with full free coverage of all these markets
3. If TradingView unofficial feed is unavailable -> `finnhub` / `twelvedata` if API keys are configured (delayed/polling)
4. Final fallback -> `yahoo` (unofficial, delayed, no key)
5. `stockerapi` is disabled by default: the repo has no free tier, it is a paid product shell
