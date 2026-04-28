import { ObjectLiteral, Repository } from "typeorm";
import { parseFilter } from "@/lib/crud/query/typeorm-query-mapper";
import { Filter } from "@/lib/crud/query/query";
import { BaseService } from "@/lib/crud/service/base.service";
import { BaseEntity } from "@/lib/crud/entity/base.entity";
import { genId } from "@/lib/crud/entity/id";

export class CrudService<
  Entity extends BaseEntity,
  Create extends ObjectLiteral = ObjectLiteral,
  Update extends ObjectLiteral = ObjectLiteral
> extends BaseService<Entity> {

  constructor(
    protected readonly name: string,
    protected readonly repository: Repository<Entity>
  ) {
    super(name, repository);
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

  async create(data: Create): Promise<Entity> {
    return this.track("create", { data }, async () => {
      const entity = this.repository.create(data as any) as unknown as Entity;
      this.prepareEntity(entity, new Date());
      return this.repository.save(entity);
    });
  }

  async createBulk(data: Create[]): Promise<Entity[]> {
    return this.track("createBulk", { data }, async () => {
      const now = new Date();
      const entities = this.repository.create(data as any[]).map(entity => {
        this.prepareEntity(entity, now);
        return entity;
      });
      return this.repository.save(entities);
    });
  }

  async upsert(data: Create): Promise<Entity> {
    return this.track("upsert", { data }, async () => {
      const now = new Date();
      const entity = this.repository.create(data as any) as unknown as Entity;
      this.prepareEntity(entity, now);
      entity.updatedAt = now;
      await this.repository.upsert(entity as any, { conflictPaths: ["id"] });
      return entity;
    });
  }

  async upsertBulk(data: Create[]): Promise<Entity[]> {
    return this.track("upsertBulk", { data }, async () => {
      const now = new Date();
      const entities = this.repository.create(data as any[]).map(entity => {
        this.prepareEntity(entity, now);
        entity.updatedAt = now;
        return entity;
      });
      await this.repository.upsert(entities as any[], { conflictPaths: ["id"] });
      return entities;
    });
  }

  async update(id: string, data: Update, options?: { silent?: boolean }): Promise<Entity | null> {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (id == null) {
      throw new Error("null id passed in update");
    }
    return this.track("update", { id, data }, async () => {
      const updateData: Record<string, any> = { ...data };
      if (!options?.silent) {
        updateData.updatedAt = new Date();
      }
      await this.repository.update(id, updateData);
      return this.repository.findOne({ where: { id } as any });
    });
  }

  async updateIndexed(filter: Filter<Entity>, data: Update, options?: { silent?: boolean }): Promise<Entity[]> {
    return this.track("updateIndexed", { filter: data }, async () => {
      const filterConditions = parseFilter(filter);
      const entities = await this.repository.find({ where: filterConditions });
      if (entities.length === 0) {
        return [];
      }
      const ids = entities.map(e => e.id);
      const updateData = options?.silent ? { ...data } : { ...data, updatedAt: new Date() };
      await this.repository.update(ids, updateData);
      return entities.map(entity => Object.assign({}, entity, updateData) as Entity);
    });
  }

  async deleteById(id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (id == null) {
      throw new Error("null id passed in deleteById");
    }
    return this.track("deleteById", { id }, () => this.repository.delete(id).then(() => undefined));
  }

  async deleteIndexed(filter: Filter<Entity>): Promise<void> {
    return this.track("deleteIndexed", { filter }, async () => {
      const filterConditions = parseFilter(filter);
      await this.repository.delete(filterConditions);
    });
  }
}
