/**
 * Shared circuit breaker + health tracker for every market data provider.
 *
 * One misbehaving upstream (rate limit, IP block, outage) must never
 * cascade into repeated slow/failing calls elsewhere in the app -- once a
 * provider has failed enough times in a row, the breaker "opens" and
 * further attempts fail instantly (no network call) until a cooldown
 * elapses, at which point exactly one attempt is allowed through
 * ("half-open") to test recovery.
 *
 * This generalizes the ad-hoc cooldown that was previously hand-rolled
 * only for TradingView's socket (see tradingview-socket.ts) to every
 * provider, and backs the /api/provider-diagnostics endpoint.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface ProviderHealthSnapshot {
  provider: string;
  state: CircuitState;
  consecutiveFailures: number;
  totalSuccesses: number;
  totalFailures: number;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
  lastLatencyMs: number | null;
  lastError: string | null;
}

const FAILURE_THRESHOLD = 3;
const OPEN_COOLDOWN_MS = 30_000;

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private totalSuccesses = 0;
  private totalFailures = 0;
  private lastSuccessAt: number | null = null;
  private lastFailureAt: number | null = null;
  private lastLatencyMs: number | null = null;
  private lastError: string | null = null;
  private openedAt = 0;

  constructor(private readonly provider: string) {}

  /** Whether a real attempt should even be made right now. Flips
   * open -> half-open once the cooldown elapses, without recording that
   * as a state change on its own (only an actual attempt's outcome does). */
  canAttempt(): boolean {
    if (this.state !== 'open') return true;
    if (Date.now() - this.openedAt >= OPEN_COOLDOWN_MS) {
      this.state = 'half-open';
      return true;
    }
    return false;
  }

  recordSuccess(latencyMs: number): void {
    this.state = 'closed';
    this.consecutiveFailures = 0;
    this.totalSuccesses++;
    this.lastSuccessAt = Date.now();
    this.lastLatencyMs = latencyMs;
    this.lastError = null;
  }

  recordFailure(error: unknown): void {
    this.consecutiveFailures++;
    this.totalFailures++;
    this.lastFailureAt = Date.now();
    this.lastError = error instanceof Error ? error.message : String(error);
    if (this.consecutiveFailures >= FAILURE_THRESHOLD) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }

  snapshot(): ProviderHealthSnapshot {
    return {
      provider: this.provider,
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      totalSuccesses: this.totalSuccesses,
      totalFailures: this.totalFailures,
      lastSuccessAt: this.lastSuccessAt,
      lastFailureAt: this.lastFailureAt,
      lastLatencyMs: this.lastLatencyMs,
      lastError: this.lastError,
    };
  }
}

class ProviderHealthRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  private breakerFor(provider: string): CircuitBreaker {
    let breaker = this.breakers.get(provider);
    if (!breaker) {
      breaker = new CircuitBreaker(provider);
      this.breakers.set(provider, breaker);
    }
    return breaker;
  }

  /** Runs `fn` guarded by the named provider's circuit breaker. Returns
   * `null` immediately (no call attempted) if the breaker is open --
   * callers already treat a null quote as "try the next provider", so
   * this composes directly into a fallback chain without extra
   * try/catch noise at each call site. */
  async attempt<T>(provider: string, fn: () => Promise<T | null>): Promise<T | null> {
    const breaker = this.breakerFor(provider);
    if (!breaker.canAttempt()) return null;

    const start = Date.now();
    try {
      const result = await fn();
      breaker.recordSuccess(Date.now() - start);
      return result;
    } catch (err) {
      breaker.recordFailure(err);
      return null;
    }
  }

  snapshot(provider: string): ProviderHealthSnapshot | null {
    return this.breakers.get(provider)?.snapshot() ?? null;
  }

  allSnapshots(): ProviderHealthSnapshot[] {
    return [...this.breakers.values()].map((b) => b.snapshot());
  }
}

export const providerHealth = new ProviderHealthRegistry();
