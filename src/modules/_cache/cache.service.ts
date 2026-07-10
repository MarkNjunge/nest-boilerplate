import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { createClient, RedisClientType, OpenTelemetry } from "redis";
import { config } from "@/config";
import { Logger } from "@/logging/Logger";
import { ICacheService } from "@/lib/crud/cache/i-cache.service";

@Injectable()
export class CacheService implements ICacheService,OnModuleDestroy {
  private client: RedisClientType;
  private prefix = config.redis.keyPrefix;

  private logger = new Logger("CacheService");

  constructor() {
    this.client = createClient({
      url: config.redis.url,
      socket: {
        connectTimeout: config.redis.connectTimeout
      }
    });

    this.client.on("connect", () => {
      this.logger.debug("Redis is connecting...");
    });
    this.client.on("ready", () => {
      this.logger.debug("Redis is ready");
    });
    this.client.on("end", () => {
      this.logger.debug("Redis is closed");
    });
    this.client.on("error", e => {
      if (e.errors != null) {
        const message = e.errors.map((err: Error) => err.message).join(", ");
        this.logger.error(`Redis client error: ${message}`);
      } else {
        this.logger.error(`Redis client error: ${e.message}`);
      }
    });
    this.client.on("reconnecting", () => {
      this.logger.warn("Redis is reconnecting");
    });

    OpenTelemetry.init({
      metrics: {
        enabled: true,
        enabledMetricGroups: ["connection-basic", "resiliency", "command"]
      }
    });
  }

  async connect() {
    await this.client.connect();
    await this.client.ping();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  private pkey(key: string): string {
    return this.prefix + key;
  }

  async set(key: string, value: string | number, ttlS?: number): Promise<boolean> {
    const fullKey = this.pkey(key);
    const startTime = performance.now();
    try {
      await this.client.set(fullKey, value,
        {
          expiration: ttlS != null ? { type: "EX", value: ttlS } : undefined
        }
      );

      if (config.redis.logCommands) {
        const duration = (performance.now() - startTime).toFixed(2);
        this.logger.debug(`SET ${fullKey}, ttlS=${ttlS} | ${duration}ms`);
      }

      return true;
    } catch (e: any) {
      this.logger.error(`SET error: ${fullKey}: ${e.message}`);
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    const fullKey = this.pkey(key);
    const startTime = performance.now();
    try {
      const val = await this.client.get(fullKey);

      if (config.redis.logCommands) {
        const duration = (performance.now() - startTime).toFixed(2);
        this.logger.debug(`GET ${fullKey} | ${duration}ms`);
      }

      return val;
    } catch (e: any) {
      this.logger.error(`GET error: ${fullKey}: ${e.message}`);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    const fullKey = this.pkey(key);
    const startTime = performance.now();
    try {
      await this.client.del(fullKey);

      if (config.redis.logCommands) {
        const duration = (performance.now() - startTime).toFixed(2);
        this.logger.debug(`DEL ${fullKey} | ${duration}ms`);
      }
    } catch (e: any) {
      this.logger.error(`DEL error: ${fullKey}: ${e.message}`);
    }
  }

  async setJSON(key: string, value: any, ttlS?: number): Promise<boolean> {
    const str = JSON.stringify(value);
    return this.set(key, str, ttlS);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const val = await this.get(key);
    if (val == null) {
      return null;
    }
    return JSON.parse(val) as T;
  }

  async incr(key: string): Promise<number> {
    const fullKey = this.pkey(key);
    const startTime = performance.now();
    try {
      const val = await this.client.incr(fullKey);
      if (config.redis.logCommands) {
        const duration = (performance.now() - startTime).toFixed(2);
        this.logger.debug(`INCR ${fullKey} | ${duration}ms`);
      }
      return val;
    } catch (e: any) {
      if (e.message.includes("increment or decrement would overflow")) {
        this.logger.debug(`INCR '${fullKey}' would overflow. Resetting...`);
        await this.del(key);
        return this.incr(key);
      }

      this.logger.error(`INCR error: ${fullKey}: ${e.message}`);
      return 0;
    }
  }
}
