import { Equal, ObjectLiteral, Repository } from "typeorm";
import { parseFilter } from "@/lib/crud/query/typeorm-query-mapper";
import { Filter, Query } from "@/lib/crud/query";
import { BaseService, ServiceOptions } from "@/lib/crud/service/base.service";
import { BaseEntity } from "@/lib/crud/entity/base.entity";
import { genId } from "@/lib/crud/entity/id";
import { ICrudContext } from "@/lib/crud/utils/context";

export class CrudService<
  Entity extends BaseEntity,
  Create extends ObjectLiteral = ObjectLiteral,
  Update extends ObjectLiteral = ObjectLiteral
> extends BaseService<Entity> {

  constructor(
    protected readonly name: string,
    protected readonly repository: Repository<Entity>,
    serviceOptions: ServiceOptions = {}
  ) {
    super(name, repository, serviceOptions);
  }

  // Sets id, createdAt, and updatedAt on an entity if they are not already present.
  private prepareEntity(entity: Entity, now: Date): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    entity.id = entity.id ?? genId(entity.idPrefix());
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    entity.createdAt = entity.createdAt ?? now;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    entity.updatedAt = entity.updatedAt ?? now;
  }

  // Re-fetch entities if select/include options are supplied
  private async refetchWithQuery(ctx: ICrudContext, ids: string[], query?: Query<Entity>): Promise<Entity[] | null> {
    if (!query || (!query.select && (!query.include || Object.keys(query.include).length === 0))) {
      return null;
    }
    return this.list(ctx, {
      ...query,
      filter: { in: [{ key: "id", value: ids as any }] }
    });
  }

  async create(ctx: ICrudContext, data: Create, query?: Query<Entity>): Promise<Entity> {
    return this.track("create", { data }, async () => {
      const entity = this.repository.create(data as any) as unknown as Entity;
      const userId = this.getUserId(ctx);
      if (userId) {
        (entity as any).userId = userId;
      }
      this.prepareEntity(entity, new Date());
      const saved = await this.repository.save(entity);

      const refetched = await this.refetchWithQuery(ctx, [saved.id], query);
      return refetched?.[0] ?? saved;
    });
  }

  async createBulk(ctx: ICrudContext, data: Create[], query?: Query<Entity>): Promise<Entity[]> {
    return this.track("createBulk", { data }, async () => {
      const now = new Date();
      const userId = this.getUserId(ctx);
      const entities = this.repository.create(data as any[]).map(entity => {
        if (userId) {
          (entity as any).userId = userId;
        }
        this.prepareEntity(entity, now);
        return entity;
      });
      const saved = await this.repository.save(entities);

      const ids = saved.map(e => e.id);
      const refetched = await this.refetchWithQuery(ctx, ids, query);
      return refetched ?? saved;
    });
  }

  async upsert(ctx: ICrudContext, data: Create, query?: Query<Entity>): Promise<Entity> {
    return this.track("upsert", { data }, async () => {
      const now = new Date();
      const entity = this.repository.create(data as any) as unknown as Entity;
      const userId = this.getUserId(ctx);
      if (userId) {
        (entity as any).userId = userId;
      }
      this.prepareEntity(entity, now);
      entity.updatedAt = now;
      await this.repository.upsert(entity as any, { conflictPaths: ["id"] });
      const refetched = await this.refetchWithQuery(ctx, [entity.id], query);
      return refetched?.[0] ?? entity;
    });
  }

  async upsertBulk(ctx: ICrudContext, data: Create[], query?: Query<Entity>): Promise<Entity[]> {
    return this.track("upsertBulk", { data }, async () => {
      const now = new Date();
      const userId = this.getUserId(ctx);
      const entities = this.repository.create(data as any[]).map(entity => {
        if (userId) {
          (entity as any).userId = userId;
        }
        this.prepareEntity(entity, now);
        entity.updatedAt = now;
        return entity;
      });
      const upsertRes = await this.repository.upsert(entities as any[], { conflictPaths: ["id"] });

      return this.list(ctx, {
        ...query,
        filter: { in: [{ key: "id", value: upsertRes.identifiers.map(i => i.id) as any }] }
      });
    });
  }

  async update(ctx: ICrudContext, id: string, data: Update, query?: Query<Entity>, options?: { silent?: boolean }): Promise<Entity | null> {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (id == null) {
      throw new Error("null id passed in update");
    }
    return this.track("update", { id, data }, async () => {
      const userId = this.getUserId(ctx);
      const whereClause: any = userId ? { id, userId } : { id };
      const updateData: Record<string, any> = { ...data };
      if (!options?.silent) {
        updateData.updatedAt = new Date();
      }
      await this.repository.update(whereClause, updateData);

      const refetched = await this.refetchWithQuery(ctx, [id], query);
      return refetched?.[0] ?? await this.getById(ctx, id);
    });
  }

  async updateIndexed(ctx: ICrudContext, filter: Filter<Entity>, data: Update, query?: Query<Entity>, options?: { silent?: boolean }): Promise<Entity[]> {
    return this.track("updateIndexed", { filter: data }, async () => {
      const userId = this.getUserId(ctx);
      let filterConditions = parseFilter(filter);
      if (userId) {
        if (Array.isArray(filterConditions)) {
          filterConditions = filterConditions.map(f => ({ ...f, userId: Equal(userId) })) as any;
        } else {
          filterConditions = { ...filterConditions, userId: Equal(userId) };
        }
      }

      const updateData = options?.silent ? { ...data } : { ...data, updatedAt: new Date() };
      const updateRes = await this.repository.update(filterConditions, updateData, { returning: ["id"] });

      const ids: string[] = updateRes.raw.map((r: Partial<Entity>) => r.id);
      return this.list(ctx, {
        ...query,
        filter: { in: [{ key: "id", value: ids as any }] }
      });
    });
  }

  async deleteById(ctx: ICrudContext, id: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (id == null) {
      throw new Error("null id passed in deleteById");
    }
    return this.track("deleteById", { id }, async () => {
      const userId = this.getUserId(ctx);
      if (userId) {
        const result = await this.repository.delete({ id, userId } as any);
        return result.affected ?? 0;
      } else {
        const result = await this.repository.delete(id);
        return result.affected ?? 0;
      }
    });
  }

  async deleteIndexed(ctx: ICrudContext, filter: Filter<Entity>): Promise<number> {
    return this.track("deleteIndexed", { filter }, async () => {
      const userId = this.getUserId(ctx);
      let filterConditions = parseFilter(filter);
      if (userId) {
        if (Array.isArray(filterConditions)) {
          filterConditions = filterConditions.map(f => ({ ...f, userId: Equal(userId) })) as any;
        } else {
          filterConditions = { ...filterConditions, userId: Equal(userId) };
        }
      }
      const result = await this.repository.delete(filterConditions);
      return result.affected ?? 0;
    });
  }
}
