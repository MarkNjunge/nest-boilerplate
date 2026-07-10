import { Injectable } from "@nestjs/common";
import { CrudService, CursorPaginationResult, Filter, ICrudContext, Query } from "@/lib/crud";
import { Category, CategoryCreateDto, CategoryUpdateDto } from "@/models/category/category";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { sha1Obj } from "@/utils/crypto";
import { CacheService } from "@/modules/_cache/cache.service";
import { Logger } from "@/logging/Logger";

@Injectable()
export class CategoryService extends CrudService<Category, CategoryCreateDto, CategoryUpdateDto> {
  protected logger = new Logger("CategoryService");

  private CACHE_TTL = 300;

  constructor(
    @InjectRepository(Category)
    protected readonly categoryRepository: Repository<Category>,
    protected readonly cacheService: CacheService
  ) {
    super("Category", categoryRepository, { userScoped: false });
  }

  cacheNs(ctx: ICrudContext) {
    return "categories";
  }

  genKey(ctx: ICrudContext) {
    return `${this.cacheNs(ctx)}:gen`;
  }

  idKey(ctx: ICrudContext, id: string): string {
    return `${this.cacheNs(ctx)}:${id}`;
  }

  async invalidateCache(ctx: ICrudContext, ids?: string[]) {
    await Promise.all([
      this.cacheService.incr(this.genKey(ctx)),
      ...(ids ?? []).map(id => this.cacheService.del(this.idKey(ctx, id)))
    ]);
  }

  async list(ctx: ICrudContext, query: Query<Category> = {}): Promise<Category[]> {
    const gen = (await this.cacheService.get(this.genKey(ctx))) ?? "0";
    const key = `${this.cacheNs(ctx)}:list:${gen}:${sha1Obj(query)}`;

    const cached = await this.cacheService.getJSON<Category[]>(key);
    if (cached != null) {
      this.logger.debug(`list HIT | key=${key}`);
      return cached;
    }

    this.logger.debug(`list MISS | key=${key}`);
    const result = await super.list(ctx, query);
    await this.cacheService.setJSON(key, result, this.CACHE_TTL);

    return result;
  }

  async get(ctx: ICrudContext, query: Query<Category> = {}): Promise<Category | null> {
    const gen = (await this.cacheService.get(this.genKey(ctx))) ?? "0";
    const key = `${this.cacheNs(ctx)}:get:${gen}:${sha1Obj(query)}`;

    const cached = await this.cacheService.getJSON<Category>(key);
    if (cached != null) {
      this.logger.debug(`get HIT | key=${key}`);
      return cached;
    }

    this.logger.debug(`get MISS | key=${key}`);

    const result = await super.get(ctx, query);
    if (result != null) {
      await this.cacheService.setJSON(key, result, this.CACHE_TTL);
    }
    return result;
  }

  async getById(ctx: ICrudContext, id: string, query: Query<Category> = {}): Promise<Category | null> {
    const key = this.idKey(ctx, id);

    const cached = await this.cacheService.getJSON<Category>(key);
    if (cached != null) {
      this.logger.debug(`getById HIT | id=${id}`);
      return cached;
    }

    this.logger.debug(`getById MISS | id=${id}`);
    const result = await super.getById(ctx, id, query);
    if (result != null) {
      await this.cacheService.setJSON(key, result, this.CACHE_TTL);
    }
    return result;
  }

  async listCursor(ctx: ICrudContext, query: Query<Category> = {}): Promise<CursorPaginationResult<Category>> {
    const gen = (await this.cacheService.get(this.genKey(ctx))) ?? "0";
    const key = `${this.cacheNs(ctx)}:list_cursor:${gen}:${sha1Obj(query)}`;

    const cached = await this.cacheService.getJSON<CursorPaginationResult<Category>>(key);
    if (cached != null) {
      this.logger.debug(`listCursor HIT | key=${key}`);
      return cached;
    }

    this.logger.debug(`listCursor MISS | key=${key}`);
    const result = await super.listCursor(ctx, query);
    await this.cacheService.setJSON(key, result, this.CACHE_TTL);
    return result;
  }

  async create(ctx: ICrudContext, data: CategoryCreateDto, query?: Query<Category>): Promise<Category> {
    const result = await super.create(ctx, data, query);
    await this.invalidateCache(ctx);
    return result;
  }

  async createBulk(ctx: ICrudContext, data: CategoryCreateDto[], query?: Query<Category>): Promise<Category[]> {
    const result = await super.createBulk(ctx, data, query);
    await this.invalidateCache(ctx);
    return result;
  }

  async upsert(ctx: ICrudContext, data: CategoryCreateDto, query?: Query<Category>): Promise<Category> {
    const result = await super.upsert(ctx, data, query);
    await this.invalidateCache(ctx, [result.id]);
    return result;
  }

  async upsertBulk(ctx: ICrudContext, data: CategoryCreateDto[], query?: Query<Category>): Promise<Category[]> {
    const result = await super.upsertBulk(ctx, data, query);
    await this.invalidateCache(ctx, result.map(r => r.id));
    return result;
  }

  async update(
    ctx: ICrudContext,
    id: string,
    data: CategoryUpdateDto,
    query?: Query<Category>,
    options?: { silent?: boolean }
  ): Promise<Category | null> {
    const result = await super.update(ctx, id, data, query, options);
    await this.invalidateCache(ctx, [id]);
    return result;
  }

  async updateIndexed(ctx: ICrudContext, filter: Filter<Category>, data: CategoryUpdateDto, query?: Query<Category>, options?: {
    silent?: boolean;
  }): Promise<Category[]> {
    const result = await super.updateIndexed(ctx, filter, data, query, options);
    await this.invalidateCache(ctx, result.map(r => r.id));
    return result;
  }

  async deleteById(ctx: ICrudContext, id: string): Promise<number> {
    const result = await super.deleteById(ctx, id);
    await this.invalidateCache(ctx, [id]);
    return result;
  }

  async deleteIndexed(ctx: ICrudContext, filter: Filter<Category>): Promise<number> {
    const toDelete = await this.list(ctx, { select: { id: true }, filter });
    const result = await super.deleteIndexed(ctx, filter);
    await this.invalidateCache(ctx, toDelete.map(r => r.id));
    return result;
  }
}
