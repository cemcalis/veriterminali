# Provider Test Report

Generated: 2026-07-04T16:07:46.797Z

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
| TradingView Scanner (experimental, bulk BIST table data only) (`tradingview-scanner`) | no | YES (unofficial) | OK — OK (experimental, bulk BIST scanner/table data only -- not used for single-symbol quotes) | not required |
| Yahoo Finance (unofficial, delayed fallback) (`yahoo`) | no | YES (unofficial) | OK — OK (unofficial, delayed) | not required |

## Binance WebSocket (`binance`)

- Realtime: true
- Experimental/unofficial: false
- Health: OK (1106ms) — OK

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62958.72 | 401ms |
| BINANCE:ETHUSDT | OK | 1790.35 | 324ms |
| BINANCE:SOLUSDT | OK | 82.29 | 309ms |

## TradingView (twc-style quote session) (`tradingview-twc`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (339ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62958.72 | 191ms |
| BINANCE:ETHUSDT | OK | 1790.34 | 193ms |
| BINANCE:SOLUSDT | OK | 82.29 | 172ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14329 | 145ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33435 | 144ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.753 | 147ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 148ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 147ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 179ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 233ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 200ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 185ms |
| NATGAS | OK | 3.22 | 161ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 170ms |
| BIST:THYAO | OK | 334 | 219ms |
| BIST:ASELS | OK | 399.5 | 146ms |
| BIST:KCHOL | OK | 189.6 | 124ms |
| BIST:SISE | OK | 44.34 | 172ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 143ms |
| TSLA | OK | 393.45 | 151ms |
| NVDA | OK | 194.83 | 117ms |
| MSFT | OK | 390.49 | 252ms |
| SPY | OK | 744.78 | 188ms |
| QQQ | OK | 712.6 | 209ms |

## TradingView (OHLCV microservice-style) (`tradingview-microservice`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (6392ms) — OK (experimental/unofficial)

### crypto (2/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62955.65 | 6017ms |
| BINANCE:ETHUSDT | FAIL: no price returned | - | 6392ms |
| BINANCE:SOLUSDT | OK | 82.28 | 6011ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14329 | 6009ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33435 | 6007ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.753 | 6001ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 6006ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 6012ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 6011ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 6004ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 6005ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 6007ms |
| NATGAS | OK | 3.22 | 6016ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 6007ms |
| BIST:THYAO | OK | 334 | 6000ms |
| BIST:ASELS | OK | 399.5 | 6008ms |
| BIST:KCHOL | OK | 189.6 | 6015ms |
| BIST:SISE | OK | 44.34 | 6000ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.27 | 6003ms |
| TSLA | OK | 393.24 | 6009ms |
| NVDA | OK | 194.69 | 6003ms |
| MSFT | OK | 389.83 | 6001ms |
| SPY | OK | 745.2 | 6001ms |
| QQQ | OK | 712.7 | 6004ms |

## TradingView (quote+candle client-style) (`tradingview-ws-client`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (597ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 62898 | 796ms |
| BINANCE:ETHUSDT | OK | 1790.09 | 573ms |
| BINANCE:SOLUSDT | OK | 82.22 | 611ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14329 | 345ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33435 | 182ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.753 | 135ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 173ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 193ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 167ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 154ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 178ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 177ms |
| NATGAS | OK | 3.22 | 178ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 265ms |
| BIST:THYAO | OK | 334 | 337ms |
| BIST:ASELS | OK | 399.5 | 166ms |
| BIST:KCHOL | OK | 189.6 | 400ms |
| BIST:SISE | OK | 44.34 | 149ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 241ms |
| TSLA | OK | 393.45 | 304ms |
| NVDA | OK | 194.83 | 228ms |
| MSFT | OK | 390.49 | 331ms |
| SPY | OK | 744.78 | 265ms |
| QQQ | OK | 712.6 | 221ms |

## StockerAPI / Kun Data (BIST, paid) (`stockerapi`)

- Realtime: true
- Experimental/unofficial: false
- Health: DOWN (n/ams) — NO FREE TIER: repo is a marketing shell for the paid Kun Data API (kun.pro). Requires STOCKERAPI_TOKEN.

### bist (0/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | FAIL: no price returned | - | 1ms |
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
- Health: OK (620ms) — OK (official ECB daily reference, not real-time)

### forex (3/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD | OK | 1.1448 | 369ms |
| GBPUSD | OK | 1.3355 | 137ms |
| USDTRY | OK | 46.805 | 168ms |
| XAUUSD | FAIL: no price returned | - | 176ms |
| XAGUSD | FAIL: no price returned | - | 203ms |

## Bigpara / Hürriyet (public frontend JSON, unofficial, near-live BIST) (`bigpara`)

- Realtime: false
- Experimental/unofficial: true
- Health: DOWN (377ms) — HTTP 401

### bist (2/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | FAIL: no price returned | - | 202ms |
| BIST:THYAO | OK | 334 | 368ms |
| BIST:ASELS | FAIL: no price returned | - | 46ms |
| BIST:KCHOL | OK | 189.6 | 143ms |
| BIST:SISE | FAIL: no price returned | - | 50ms |

## İş Yatırım (public frontend JSON, unofficial, daily BIST OHLC) (`isyatirim`)

- Realtime: false
- Experimental/unofficial: true
- Health: OK (517ms) — OK (unofficial public frontend endpoint, daily BIST OHLC history)

### bist (4/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | FAIL: no price returned | - | 56ms |
| BIST:THYAO | OK | 334 | 84ms |
| BIST:ASELS | OK | 399.5 | 54ms |
| BIST:KCHOL | OK | 189.6 | 103ms |
| BIST:SISE | OK | 44.34 | 73ms |

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

## TradingView Scanner (experimental, bulk BIST table data only) (`tradingview-scanner`)

- Realtime: false
- Experimental/unofficial: true
- Health: OK (789ms) — OK (experimental, bulk BIST scanner/table data only -- not used for single-symbol quotes)

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 771ms |
| BIST:THYAO | OK | 334 | 235ms |
| BIST:ASELS | OK | 399.5 | 583ms |
| BIST:KCHOL | OK | 189.6 | 514ms |
| BIST:SISE | OK | 44.34 | 526ms |

## Yahoo Finance (unofficial, delayed fallback) (`yahoo`)

- Realtime: false
- Experimental/unofficial: true
- Health: OK (618ms) — OK (unofficial, delayed)

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 375ms |
| TSLA | OK | 393.45 | 138ms |
| NVDA | OK | 194.83 | 190ms |
| MSFT | OK | 390.49 | 197ms |
| SPY | OK | 744.78 | 185ms |
| QQQ | OK | 712.6 | 221ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD | OK | 1.144 | 192ms |
| GBPUSD | OK | 1.335 | 170ms |
| USDTRY | OK | 46.753 | 136ms |
| XAUUSD | OK | 4187.3 | 152ms |
| XAGUSD | OK | 62.815 | 122ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD | OK | 4187.3 | 105ms |
| SILVER | OK | 62.815 | 92ms |
| USOIL | OK | 68.78 | 139ms |
| BRENT | OK | 72.13 | 143ms |
| NATGAS | OK | 3.245 | 131ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 197ms |
| BIST:THYAO | OK | 334 | 148ms |
| BIST:ASELS | OK | 399.5 | 212ms |
| BIST:KCHOL | OK | 189.6 | 237ms |
| BIST:SISE | OK | 44.34 | 314ms |

## Conclusions & Recommended Routing

- Official realtime sources that work: binance
- Experimental/unofficial realtime sources that work: tradingview-twc, tradingview-microservice, tradingview-ws-client
- Delayed/fallback sources that work: ecb, isyatirim, tradingview-scanner, yahoo

Recommended routing implemented in `provider-registry.ts`:
1. Crypto -> `binance` (official, free, true realtime, no key)
2. Forex/commodities/BIST/US stocks/indices -> `tradingview-twc` (experimental unofficial feed, true realtime, no key) as primary since it is the only source with full free coverage of all these markets
3. If TradingView unofficial feed is unavailable -> `finnhub` / `twelvedata` if API keys are configured (delayed/polling)
4. Final fallback -> `yahoo` (unofficial, delayed, no key)
5. `stockerapi` is disabled by default: the repo has no free tier, it is a paid product shell
