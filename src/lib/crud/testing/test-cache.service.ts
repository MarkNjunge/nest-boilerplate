import { createClient, RedisClientType } from "redis";
import { ICacheService } from "@/lib/crud/cache/i-cache.service";

export interface TestCacheServiceOptions {
  url: string;
  keyPrefix?: string;
}

/**
 * A minimal `ICacheService` implementation backed by Redis, intended for use in
 * integration tests of `CrudCacheService`.
 */
export class TestCacheService implements ICacheService {
  private readonly client: RedisClientType;
  private readonly prefix: string;

  constructor(opts: TestCacheServiceOptions) {
    this.client = createClient({ url: opts.url });
    this.prefix = opts.keyPrefix ?? "";
  }

  async connect(): Promise<void> {
    await this.client.connect();
    await this.client.ping();
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  /**
   * Remove all keys under the configured prefix. Intended for test isolation between test cases.
   */
  async flush(): Promise<void> {
    if (this.prefix.length === 0) {
      await this.client.flushDb();
      return;
    }
    let cursor = "0";
    do {
      const reply = await this.client.scan(cursor, {
        MATCH: `${this.prefix}*`,
        COUNT: 100
      });
      cursor = reply.cursor;
      if (reply.keys.length > 0) {
        await this.client.del(reply.keys);
      }
    } while (cursor !== "0");
  }

  isReady(): boolean {
    return this.client.isOpen;
  }

  private pkey(key: string): string {
    return this.prefix + key;
  }

  async set(key: string, value: string | number, ttlS?: number): Promise<boolean> {
    try {
      await this.client.set(this.pkey(key), value, {
        expiration: ttlS != null ? { type: "EX", value: ttlS } : undefined
      });
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(this.pkey(key));
    } catch {
      return null;
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(this.pkey(key));
  }

  async setJSON(key: string, value: any, ttlS?: number): Promise<boolean> {
    return this.set(key, JSON.stringify(value), ttlS);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const val = await this.get(key);
    if (val == null) {
      return null;
    }
    return JSON.parse(val) as T;
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(this.pkey(key));
    } catch (e: any) {
      if (e.message.includes("increment or decrement would overflow")) {
        await this.del(key);
        return this.incr(key);
      }
      return 0;
    }
  }
}
