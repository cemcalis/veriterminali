import type { SymbolDef } from './symbols.js';

interface KeyValueStore<T> {
  read(): T;
  write(mutator: (data: T) => T): T;
}

/**
 * Symbols found via dynamic lookup (a user searched for something not in
 * the static catalog and we found a real match on a live provider).
 * Persisted (via the injected store) so a discovered symbol stays
 * available across restarts and for every other user, without requiring
 * a full catalog regeneration.
 */
export class DiscoveredSymbolStore {
  constructor(private store: KeyValueStore<Record<string, SymbolDef>>) {}

  add(def: SymbolDef): void {
    if (this.store.read()[def.symbol]) return;
    this.store.write((data) => ({ ...data, [def.symbol]: def }));
  }

  find(symbol: string): SymbolDef | undefined {
    return this.store.read()[symbol];
  }

  all(): SymbolDef[] {
    return Object.values(this.store.read());
  }

  search(query: string, limit = 20): SymbolDef[] {
    const q = query.toLowerCase();
    return this.all()
      .filter((s) => s.symbol.toLowerCase().includes(q) || s.displayNameTr.toLowerCase().includes(q))
      .slice(0, limit);
  }
}
