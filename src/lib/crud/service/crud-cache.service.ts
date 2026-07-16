import {
  BaseEntity,
  CrudService,
  CursorPaginationResult,
  Filter,
  ICrudContext,
  Query,
  ServiceOptions
} from "@/lib/crud";
import { ObjectLiteral, Repository } from "typeorm";
import { sha1Obj } from "@/lib/crud/utils/crypto";
import { ICacheService } from "@/lib/crud/cache/i-cache.service";
import opentelemetry, { Counter } from "@opentelemetry/api";
import { snakeCase } from "@/lib/crud/utils/snake-case";

export abstract class CrudCacheService<
  Entity extends BaseEntity,
  Create extends ObjectLiteral = ObjectLiteral,
  Update extends ObjectLiteral = ObjectLiteral
> extends CrudService<Entity, Create, Update> {
  protected CACHE_TTL = 300;

  protected cacheMetrics: {
    operation: Counter;
  };

  constructor(
    protected readonly name: string,
    protected readonly repository: Repository<Entity>,
    protected readonly cacheService: ICacheService,
    serviceOptions: ServiceOptions = {}
  ) {
    super(name, repository, serviceOptions);

    const meter = opentelemetry.metrics.getMeter("cache_crud");
    this.cacheMetrics = {
      operation: meter.createCounter("crud_cache_operations_total", {
        description: "CRUD cache operation"
      }),
    };
  }

  abstract cacheNs(ctx: ICrudContext): string;

  /**
   * Generation key. Used to invalidate old caches by incrementing this number.
   */
  genKey(ctx: ICrudContext) {
    return `${this.cacheNs(ctx)}:gen`;
  }

  /**
   * Cache key for records based on id
   */
  idKey(ctx: ICrudContext, id: string): string {
    return `${this.cacheNs(ctx)}:${id}`;
  }

  async invalidateCache(ctx: ICrudContext, ids?: string[]) {
    await Promise.all([
      this.cacheService.incr(this.genKey(ctx)),
      ...(ids ?? []).map(id => this.cacheService.del(this.idKey(ctx, id)))
    ]);
  }

  async list(ctx: ICrudContext, query: Query<Entity> = {}): Promise<Entity[]> {
    const gen = (await this.cacheService.get(this.genKey(ctx))) ?? "0";
    const key = `${this.cacheNs(ctx)}:list:${gen}:${sha1Obj(query)}`;
    const attr = { entity: this.name, operation: snakeCase("list") };

    const cached = await this.cacheService.getJSON<Entity[]>(key);
    if (cached != null) {
      this.cacheMetrics.operation.add(1, { ...attr, result: "hit" });
      this.logger.debug(`list HIT | key=${key}`);
      return cached;
    }

    this.cacheMetrics.operation.add(1, { ...attr, result: "miss" });
    this.logger.debug(`list MISS | key=${key}`);

    const result = await super.list(ctx, query);
    await this.cacheService.setJSON(key, result, this.CACHE_TTL);

    return result;
  }

  async get(ctx: ICrudContext, query: Query<Entity> = {}): Promise<Entity | null> {
    const gen = (await this.cacheService.get(this.genKey(ctx))) ?? "0";
    const key = `${this.cacheNs(ctx)}:get:${gen}:${sha1Obj(query)}`;
    const attr = { entity: this.name, operation: snakeCase("get") };

    const cached = await this.cacheService.getJSON<Entity>(key);
    if (cached != null) {
      this.cacheMetrics.operation.add(1, { ...attr, result: "hit" });
      this.logger.debug(`get HIT | key=${key}`);
      return cached;
    }

    this.cacheMetrics.operation.add(1, { ...attr, result: "miss" });
    this.logger.debug(`get MISS | key=${key}`);

    const result = await super.get(ctx, query);
    if (result != null) {
      await this.cacheService.setJSON(key, result, this.CACHE_TTL);
    }
    return result;
  }

  async getById(ctx: ICrudContext, id: string, query: Query<Entity> = {}): Promise<Entity | null> {
    const key = this.idKey(ctx, id);
    const attr = { entity: this.name, operation: snakeCase("getById") };

    const cached = await this.cacheService.getJSON<Entity>(key);
    if (cached != null) {
      this.cacheMetrics.operation.add(1, { ...attr, result: "hit" });
      this.logger.debug(`getById HIT | id=${id}`);
      return cached;
    }

    this.cacheMetrics.operation.add(1, { ...attr, result: "miss" });
    this.logger.debug(`getById MISS | id=${id}`);

    const result = await super.getById(ctx, id, query);
    if (result != null) {
      await this.cacheService.setJSON(key, result, this.CACHE_TTL);
    }
    return result;
  }

  async listCursor(ctx: ICrudContext, query: Query<Entity> = {}): Promise<CursorPaginationResult<Entity>> {
    const gen = (await this.cacheService.get(this.genKey(ctx))) ?? "0";
    const key = `${this.cacheNs(ctx)}:list_cursor:${gen}:${sha1Obj(query)}`;
    const attr = { entity: this.name, operation: snakeCase("listCursor") };

    const cached = await this.cacheService.getJSON<CursorPaginationResult<Entity>>(key);
    if (cached != null) {
      this.cacheMetrics.operation.add(1, { ...attr, result: "hit" });
      this.logger.debug(`listCursor HIT | key=${key}`);
      return cached;
    }

    this.cacheMetrics.operation.add(1, { ...attr, result: "miss" });
    this.logger.debug(`listCursor MISS | key=${key}`);

    const result = await super.listCursor(ctx, query);
    await this.cacheService.setJSON(key, result, this.CACHE_TTL);
    return result;
  }

  async create(ctx: ICrudContext, data: Create, query?: Query<Entity>): Promise<Entity> {
    const result = await super.create(ctx, data, query);
    await this.invalidateCache(ctx);
    return result;
  }

  async createBulk(ctx: ICrudContext, data: Create[], query?: Query<Entity>): Promise<Entity[]> {
    const result = await super.createBulk(ctx, data, query);
    await this.invalidateCache(ctx);
    return result;
  }

  async upsert(ctx: ICrudContext, data: Create, query?: Query<Entity>): Promise<Entity> {
    const result = await super.upsert(ctx, data, query);
    await this.invalidateCache(ctx, [result.id]);
    return result;
  }

  async upsertBulk(ctx: ICrudContext, data: Create[], query?: Query<Entity>): Promise<Entity[]> {
    const result = await super.upsertBulk(ctx, data, query);
    await this.invalidateCache(ctx, result.map(r => r.id));
    return result;
  }

  async update(
    ctx: ICrudContext,
    id: string,
    data: Update,
    query?: Query<Entity>,
    options?: { silent?: boolean }
  ): Promise<Entity | null> {
    const result = await super.update(ctx, id, data, query, options);
    await this.invalidateCache(ctx, [id]);
    return result;
  }

  async updateIndexed(ctx: ICrudContext, filter: Filter<Entity>, data: Update, query?: Query<Entity>, options?: {
    silent?: boolean;
  }): Promise<Entity[]> {
    const result = await super.updateIndexed(ctx, filter, data, query, options);
    await this.invalidateCache(ctx, result.map(r => r.id));
    return result;
  }

  async deleteById(ctx: ICrudContext, id: string): Promise<number> {
    const result = await super.deleteById(ctx, id);
    await this.invalidateCache(ctx, [id]);
    return result;
  }

  async deleteIndexed(ctx: ICrudContext, filter: Filter<Entity>): Promise<number> {
    const toDelete = await this.list(ctx, { select: { id: true } as any, filter });
    const result = await super.deleteIndexed(ctx, filter);
    await this.invalidateCache(ctx, toDelete.map(r => r.id));
    return result;
  }
}
