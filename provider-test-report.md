# Provider Test Report

Generated: 2026-07-04T18:09:17.342Z

## Summary

| Provider | Realtime | Experimental | Health | API Key |
|---|---|---|---|---|
| Binance WebSocket (`binance`) | yes | no | OK — OK | not required |
| TradingView (twc-style quote session) (`tradingview-twc`) | yes | YES (unofficial) | OK — OK (experimental/unofficial) | not required |
| TradingView (OHLCV microservice-style) (`tradingview-microservice`) | yes | YES (unofficial) | OK — OK (experimental/unofficial) | not required |
| TradingView (quote+candle client-style) (`tradingview-ws-client`) | yes | YES (unofficial) | OK — OK (experimental/unofficial) | not required |
| StockerAPI / Kun Data (BIST, paid) (`stockerapi`) | yes | no | DOWN — NO FREE TIER: repo is a marketing shell for the paid Kun Data API (kun.pro). Requires STOCKERAPI_TOKEN. | required, MISSING |
| Finnhub (free tier, real-time trade WS) (`finnhub`) | yes | no | DOWN — FINNHUB_API_KEY not set in .env (free tier key required, no cost) | required, MISSING |
| Twelve Data (Basic 8: 800 credits/day, 8/min, 1 WS conn) (`twelvedata`) | no | no | DOWN — TWELVEDATA_API_KEY not set in .env (Basic 8 plan: 800 credits/day, 8/min, 1 WS connection) | required, MISSING |
| Financial Modeling Prep (stable API, free tier, REST-only) (`fmp`) | no | no | DOWN — FMP_API_KEY not set in .env (free tier key required, no cost) | required, MISSING |
| Alpha Vantage (free tier, 25 req/day -- last resort) (`alphavantage`) | no | no | DOWN — ALPHAVANTAGE_API_KEY not set (free, but capped at 25 requests/day -- last-resort fallback only) | required, MISSING |
| Polygon.io / Massive (no free tier as of 2026) (`polygon`) | no | no | DOWN — NO FREE TIER: Polygon/Massive discontinued its free/low-cost plans; a paid subscription is required | required, MISSING |
| ECB reference rates (via frankfurter.dev, free, daily) (`ecb`) | no | no | OK — OK (official ECB daily reference, not real-time) | not required |
| Bigpara / Hürriyet (public frontend JSON, unofficial, near-live BIST) (`bigpara`) | no | YES (unofficial) | OK — OK (unofficial public frontend endpoint, near-live BIST snapshot) | not required |
| İş Yatırım (public frontend JSON, unofficial, daily BIST OHLC) (`isyatirim`) | no | YES (unofficial) | OK — OK (unofficial public frontend endpoint, daily BIST OHLC history) | not required |
| TCMB EVDS (official Turkish Central Bank reference rates, free key, daily) (`tcmb-evds`) | no | no | DOWN — EVDS_API_KEY not set (free registration at evds2.tcmb.gov.tr, no cost, no card required) | required, MISSING |
| BiQuote (experimental, public unofficial MT5 feed, forex only, disabled by default) (`biquote`) | no | YES (unofficial) | DOWN — BIQUOTE_ENABLED=false (default) -- disabled pending clearer BIST/ToS transparency, see file header | not required |
| TradingView Scanner (experimental, bulk BIST table data only) (`tradingview-scanner`) | no | YES (unofficial) | OK — OK (experimental, bulk BIST scanner/table data only -- not used for single-symbol quotes) | not required |
| Yahoo Finance (unofficial, delayed fallback) (`yahoo`) | no | YES (unofficial) | OK — OK (unofficial, delayed) | not required |

## Binance WebSocket (`binance`)

- Realtime: true
- Experimental/unofficial: false
- Health: OK (893ms) — OK

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 63278 | 381ms |
| BINANCE:ETHUSDT | OK | 1802.55 | 863ms |
| BINANCE:SOLUSDT | OK | 82.56 | 799ms |

## TradingView (twc-style quote session) (`tradingview-twc`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (339ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 63278.01 | 155ms |
| BINANCE:ETHUSDT | OK | 1802.54 | 123ms |
| BINANCE:SOLUSDT | OK | 82.56 | 130ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14329 | 146ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33435 | 144ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.753 | 147ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 148ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 170ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 145ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 155ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 98ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 148ms |
| NATGAS | OK | 3.22 | 145ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 156ms |
| BIST:THYAO | OK | 334 | 138ms |
| BIST:ASELS | OK | 399.5 | 150ms |
| BIST:KCHOL | OK | 189.6 | 144ms |
| BIST:SISE | OK | 44.34 | 115ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 189ms |
| TSLA | OK | 393.45 | 139ms |
| NVDA | OK | 194.83 | 145ms |
| MSFT | OK | 390.49 | 127ms |
| SPY | OK | 744.78 | 148ms |
| QQQ | OK | 712.6 | 145ms |

## TradingView (OHLCV microservice-style) (`tradingview-microservice`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (6243ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 63277.02 | 6014ms |
| BINANCE:ETHUSDT | OK | 1802.29 | 6006ms |
| BINANCE:SOLUSDT | OK | 82.54 | 6002ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14329 | 6008ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33435 | 6007ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.753 | 6013ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 6007ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 6007ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 6004ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 6011ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 6012ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 6001ms |
| NATGAS | OK | 3.22 | 6004ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 6001ms |
| BIST:THYAO | OK | 334 | 6007ms |
| BIST:ASELS | OK | 399.5 | 6005ms |
| BIST:KCHOL | OK | 189.6 | 6013ms |
| BIST:SISE | OK | 44.34 | 6010ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.27 | 6006ms |
| TSLA | OK | 393.24 | 6002ms |
| NVDA | OK | 194.69 | 6008ms |
| MSFT | OK | 389.83 | 6006ms |
| SPY | OK | 745.2 | 6016ms |
| QQQ | OK | 712.7 | 6003ms |

## TradingView (quote+candle client-style) (`tradingview-ws-client`)

- Realtime: true
- Experimental/unofficial: true
- Health: OK (354ms) — OK (experimental/unofficial)

### crypto (3/3 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BINANCE:BTCUSDT | OK | 63244.01 | 199ms |
| BINANCE:ETHUSDT | OK | 1800.37 | 186ms |
| BINANCE:SOLUSDT | OK | 82.5 | 145ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD (as FX:EURUSD) | OK | 1.14329 | 277ms |
| GBPUSD (as FX:GBPUSD) | OK | 1.33435 | 176ms |
| USDTRY (as FX_IDC:USDTRY) | OK | 46.753 | 312ms |
| XAUUSD (as OANDA:XAUUSD) | OK | 4175.695 | 228ms |
| XAGUSD (as OANDA:XAGUSD) | OK | 62.403 | 183ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD (as TVC:GOLD) | OK | 4174.76 | 166ms |
| SILVER (as TVC:SILVER) | OK | 62.3724 | 170ms |
| USOIL (as TVC:USOIL) | OK | 68.77 | 200ms |
| BRENT (as BLACKBULL:BRENT) | OK | 72.115 | 158ms |
| NATGAS | OK | 3.22 | 152ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 144ms |
| BIST:THYAO | OK | 334 | 146ms |
| BIST:ASELS | OK | 399.5 | 142ms |
| BIST:KCHOL | OK | 189.6 | 219ms |
| BIST:SISE | OK | 44.34 | 176ms |

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 173ms |
| TSLA | OK | 393.45 | 144ms |
| NVDA | OK | 194.83 | 146ms |
| MSFT | OK | 390.49 | 170ms |
| SPY | OK | 744.78 | 153ms |
| QQQ | OK | 712.6 | 140ms |

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
| BINANCE:BTCUSDT | FAIL: no price returned | - | 0ms |
| BINANCE:ETHUSDT | FAIL: no price returned | - | 0ms |
| BINANCE:SOLUSDT | FAIL: no price returned | - | 0ms |

## Twelve Data (Basic 8: 800 credits/day, 8/min, 1 WS conn) (`twelvedata`)

- Realtime: false
- Experimental/unofficial: false
- Health: DOWN (n/ams) — TWELVEDATA_API_KEY not set in .env (Basic 8 plan: 800 credits/day, 8/min, 1 WS connection)

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

## Financial Modeling Prep (stable API, free tier, REST-only) (`fmp`)

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
| XAUUSD | FAIL: no price returned | - | 1ms |
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
- Health: OK (487ms) — OK (official ECB daily reference, not real-time)

### forex (3/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD | OK | 1.1448 | 308ms |
| GBPUSD | OK | 1.3355 | 94ms |
| USDTRY | OK | 46.805 | 100ms |
| XAUUSD | FAIL: no price returned | - | 195ms |
| XAGUSD | FAIL: no price returned | - | 173ms |

## Bigpara / Hürriyet (public frontend JSON, unofficial, near-live BIST) (`bigpara`)

- Realtime: false
- Experimental/unofficial: true
- Health: OK (281ms) — OK (unofficial public frontend endpoint, near-live BIST snapshot)

### bist (1/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | FAIL: no price returned | - | 130ms |
| BIST:THYAO | OK | 334 | 315ms |
| BIST:ASELS | FAIL: no price returned | - | 59ms |
| BIST:KCHOL | FAIL: no price returned | - | 40ms |
| BIST:SISE | FAIL: no price returned | - | 50ms |

## İş Yatırım (public frontend JSON, unofficial, daily BIST OHLC) (`isyatirim`)

- Realtime: false
- Experimental/unofficial: true
- Health: OK (315ms) — OK (unofficial public frontend endpoint, daily BIST OHLC history)

### bist (4/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | FAIL: no price returned | - | 66ms |
| BIST:THYAO | OK | 334 | 56ms |
| BIST:ASELS | OK | 399.5 | 50ms |
| BIST:KCHOL | OK | 189.6 | 54ms |
| BIST:SISE | OK | 44.34 | 95ms |

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
- Health: OK (972ms) — OK (experimental, bulk BIST scanner/table data only -- not used for single-symbol quotes)

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 1167ms |
| BIST:THYAO | OK | 334 | 748ms |
| BIST:ASELS | OK | 399.5 | 283ms |
| BIST:KCHOL | OK | 189.6 | 358ms |
| BIST:SISE | OK | 44.34 | 633ms |

## Yahoo Finance (unofficial, delayed fallback) (`yahoo`)

- Realtime: false
- Experimental/unofficial: true
- Health: OK (469ms) — OK (unofficial, delayed)

### us_stock (6/6 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| AAPL | OK | 308.63 | 348ms |
| TSLA | OK | 393.45 | 127ms |
| NVDA | OK | 194.83 | 137ms |
| MSFT | OK | 390.49 | 171ms |
| SPY | OK | 744.78 | 168ms |
| QQQ | OK | 712.6 | 209ms |

### forex (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| EURUSD | OK | 1.144 | 184ms |
| GBPUSD | OK | 1.335 | 180ms |
| USDTRY | OK | 46.753 | 224ms |
| XAUUSD | OK | 4187.3 | 151ms |
| XAGUSD | OK | 62.815 | 159ms |

### commodity (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| GOLD | OK | 4187.3 | 153ms |
| SILVER | OK | 62.815 | 122ms |
| USOIL | OK | 68.78 | 135ms |
| BRENT | OK | 72.13 | 180ms |
| NATGAS | OK | 3.245 | 128ms |

### bist (5/5 working)

| Symbol | Status | Price | Latency |
|---|---|---|---|
| BIST:XU100 | OK | 14417.91 | 158ms |
| BIST:THYAO | OK | 334 | 148ms |
| BIST:ASELS | OK | 399.5 | 150ms |
| BIST:KCHOL | OK | 189.6 | 151ms |
| BIST:SISE | OK | 44.34 | 153ms |

## Conclusions & Recommended Routing

- Official realtime sources that work: binance
- Experimental/unofficial realtime sources that work: tradingview-twc, tradingview-microservice, tradingview-ws-client
- Delayed/fallback sources that work: ecb, bigpara, isyatirim, tradingview-scanner, yahoo

Recommended routing implemented in `provider-registry.ts`:
1. Crypto -> `binance` (official, free, true realtime, no key)
2. Forex/commodities/BIST/US stocks/indices -> `tradingview-twc` (experimental unofficial feed, true realtime, no key) as primary since it is the only source with full free coverage of all these markets
3. If TradingView unofficial feed is unavailable -> `finnhub` / `twelvedata` if API keys are configured (delayed/polling)
4. Final fallback -> `yahoo` (unofficial, delayed, no key)
5. `stockerapi` is disabled by default: the repo has no free tier, it is a paid product shell
