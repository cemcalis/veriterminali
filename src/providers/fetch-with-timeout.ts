/** A single slow/hanging upstream must never block an entire fallback
 * chain -- plain `fetch()` has no built-in timeout, so a network hiccup
 * on one REST provider (observed: Yahoo hanging well past 10s under
 * degraded local network conditions) can stall a request indefinitely
 * even though later fallback steps would have answered in milliseconds.
 * Every REST-only provider (yahoo, finnhub, twelvedata, fmp,
 * alphavantage, ecb) uses this instead of the bare global fetch. */
const DEFAULT_TIMEOUT_MS = 8000;

export function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}
