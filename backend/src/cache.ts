import { Redis } from 'ioredis';

/**
 * Thin cache wrapper. Uses Redis when REDIS_URL is reachable, otherwise
 * transparently falls back to an in-memory Map so the terminal still
 * works with zero external infra for local dev/demo.
 */
export class Cache {
  private redis: Redis | null = null;
  private mem = new Map<string, { value: string; expiresAt: number }>();
  private redisReady = false;

  constructor(url?: string) {
    if (!url) return;
    try {
      this.redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null });
      this.redis.connect().then(
        () => {
          this.redisReady = true;
          console.log('[cache] connected to Redis');
        },
        () => {
          console.log('[cache] Redis unavailable, using in-memory cache');
          this.redis = null;
        },
      );
    } catch {
      this.redis = null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (this.redis && this.redisReady) {
      await this.redis.set(key, serialized, 'EX', ttlSeconds);
      return;
    }
    this.mem.set(key, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis && this.redisReady) {
      const v = await this.redis.get(key);
      return v ? (JSON.parse(v) as T) : null;
    }
    const entry = this.mem.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.mem.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  backend(): 'redis' | 'memory' {
    return this.redis && this.redisReady ? 'redis' : 'memory';
  }
}
