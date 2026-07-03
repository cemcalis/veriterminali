import type { MarketProvider, MarketCategory, Quote } from './market-provider.interface.js';

export class ProviderRegistry {
  private providers = new Map<string, MarketProvider>();

  register(provider: MarketProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): MarketProvider | undefined {
    return this.providers.get(id);
  }

  all(): MarketProvider[] {
    return [...this.providers.values()];
  }

  forCategory(category: MarketCategory): MarketProvider[] {
    return this.all().filter((p) => p.categories.includes(category));
  }

  /** Best provider for a category, preferring realtime + non-experimental. */
  primaryFor(category: MarketCategory): MarketProvider | undefined {
    const candidates = this.forCategory(category);
    return (
      candidates.find((p) => p.isRealtime && !p.experimental) ??
      candidates.find((p) => p.isRealtime) ??
      candidates[0]
    );
  }

  async connectAll(): Promise<void> {
    await Promise.allSettled(this.all().map((p) => p.connect()));
  }

  async disconnectAll(): Promise<void> {
    await Promise.allSettled(this.all().map((p) => p.disconnect()));
  }

  async getQuoteWithFallback(symbol: string, category: MarketCategory): Promise<Quote | null> {
    const ordered = [
      ...this.forCategory(category).filter((p) => p.isRealtime && !p.experimental),
      ...this.forCategory(category).filter((p) => p.isRealtime && p.experimental),
      ...this.forCategory(category).filter((p) => !p.isRealtime),
    ];
    for (const provider of ordered) {
      try {
        const quote = await provider.getQuote(symbol);
        if (quote && quote.price !== null) return quote;
      } catch {
        // try next provider
      }
    }
    return null;
  }
}

export const registry = new ProviderRegistry();
