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
    this.logger.debug(`${this.name}::create`, { data: { data } });
    const attr = { entity: this.name, operation: "create" };
    let status = "success";
    const start = Date.now();
    try {
      const entity = this.repository.create(data as any) as unknown as Entity;
      this.prepareEntity(entity, new Date());
      return await this.repository.save(entity);
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async createBulk(data: Create[]): Promise<Entity[]> {
    this.logger.debug(`${this.name}::createBulk`, { data: { data } });
    const attr = { entity: this.name, operation: "create_bulk" };
    let status = "success";
    const start = Date.now();
    try {
      const now = new Date();
      const entities = this.repository.create(data as any[]).map(entity => {
        this.prepareEntity(entity, now);
        return entity;
      });
      return await this.repository.save(entities);
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async upsert(data: Create): Promise<Entity> {
    this.logger.debug(`${this.name}::upsert`, { data: { data } });
    const attr = { entity: this.name, operation: "upsert" };
    let status = "success";
    const start = Date.now();
    try {
      const now = new Date();
      const entity = this.repository.create(data as any) as unknown as Entity;
      this.prepareEntity(entity, now);
      entity.updatedAt = now;
      await this.repository.upsert(entity as any, { conflictPaths: ["id"] });
      return entity;
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async upsertBulk(data: Create[]): Promise<Entity[]> {
    this.logger.debug(`${this.name}::upsertBulk`, { data: { data } });
    const attr = { entity: this.name, operation: "upsert_bulk" };
    let status = "success";
    const start = Date.now();
    try {
      const now = new Date();
      const entities = this.repository.create(data as any[]).map(entity => {
        this.prepareEntity(entity, now);
        entity.updatedAt = now;
        return entity;
      });
      await this.repository.upsert(entities as any[], { conflictPaths: ["id"] });
      return entities;
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async update(id: string, data: Update, options?: { silent?: boolean }): Promise<Entity | null> {
    this.logger.debug(`${this.name}::update`, { data: { id, data } });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (id == null) {
      throw new Error("null id passed in update");
    }

    const attr = { entity: this.name, operation: "update" };
    let status = "success";
    const start = Date.now();
    try {
      const updateData: Record<string, any> = { ...data };
      if (!options?.silent) {
        updateData.updatedAt = new Date();
      }
      await this.repository.update(id, updateData);
      return await this.repository.findOne({ where: { id } as any });
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async updateIndexed(filter: Filter<Entity>, data: Update, options?: { silent?: boolean }): Promise<Entity[]> {
    this.logger.debug(`${this.name}::updateIndexed`, { data: { filter: data } });
    const attr = { entity: this.name, operation: "update_indexed" };
    let status = "success";
    const start = Date.now();
    try {
      const filterConditions = parseFilter(filter);
      const entities = await this.repository.find({ where: filterConditions });
      if (entities.length === 0) {
        return [];
      }
      const ids = entities.map(e => e.id);
      const updateData = options?.silent ? { ...data } : { ...data, updatedAt: new Date() };
      await this.repository.update(ids as any, updateData);
      return entities.map(entity => Object.assign({}, entity, updateData) as Entity);
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async deleteById(id: string): Promise<void> {
    this.logger.debug(`${this.name}::deleteById`, { data: { id } });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (id == null) {
      throw new Error("null id passed in deleteById");
    }

    const attr = { entity: this.name, operation: "delete_by_id" };
    let status = "success";
    const start = Date.now();
    try {
      await this.repository.delete(id);
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async deleteIndexed(filter: Filter<Entity>): Promise<void> {
    this.logger.debug(`${this.name}::deleteIndexed`, { data: { filter } });
    const attr = { entity: this.name, operation: "delete_indexed" };
    let status = "success";
    const start = Date.now();
    try {
      const filterConditions = parseFilter(filter);
      await this.repository.delete(filterConditions as any);
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }
}
