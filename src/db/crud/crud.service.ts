import { DeepPartial, ObjectLiteral, Repository, FindOneOptions } from "typeorm";
import { mapQueryToTypeorm, parseFilter } from "@/db/query/typeorm-query-mapper";
import { Filter, Query } from "@/db/query/query";
import { Logger } from "@/logging/Logger";
import opentelemetry, { Counter, Histogram } from "@opentelemetry/api";

export class CrudService<
  Entity extends ObjectLiteral,
  Create extends DeepPartial<Entity> = DeepPartial<Entity>,
  Update extends DeepPartial<Entity> = DeepPartial<Entity>
> {

  protected logger: Logger;
  protected metrics: {
    operation: Counter;
    duration: Histogram;
  };

  constructor(
    protected readonly name: string,
    protected readonly repository: Repository<Entity>
  ) {
    this.logger = new Logger(`CRUD:${this.name}`);
    const meter = opentelemetry.metrics.getMeter("crud");

    this.metrics = {
      operation: meter.createCounter("crud_operations_total", {
        description: "CRUD operation"
      }),
      duration: meter.createHistogram("crud_operation_duration_seconds", {
        description: "CRUD operation duration"
      })
    };
  }

  async count(query: Query<Entity>) {
    this.logger.debug(`${this.name}::count`, { data: { query } });
    const attr = { entity: this.name, operation: "count" };
    let status = "success";
    const start = Date.now();
    try {
      return await this.repository.count(mapQueryToTypeorm(query));
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async list(query: Query<Entity> = {}): Promise<Entity[]> {
    this.logger.debug(`${this.name}::list`, { data: { query } });
    const attr = { entity: this.name, operation: "list" };
    let status = "success";
    const start = Date.now();
    try {
      return await this.repository.find(mapQueryToTypeorm(query));
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async get(query: Query<Entity> = {}): Promise<Entity | null> {
    this.logger.debug(`${this.name}::get`, { data: { query } });
    const attr = { entity: this.name, operation: "get" };
    let status = "success";
    const start = Date.now();
    try {
      return await this.repository.findOne(mapQueryToTypeorm(query) as FindOneOptions<Entity>);
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async getById(id: string, query: Query<Entity> = {}): Promise<Entity | null> {
    this.logger.debug(`${this.name}::getById`, { data: { query } });
    const attr = { entity: this.name, operation: "get_by_id" };
    let status = "success";
    const start = Date.now();
    try {
      const options = mapQueryToTypeorm(query) as FindOneOptions<Entity>;
      return await this.repository.findOne({
        ...options,
        // eslint-disable-next-line @typescript-eslint/no-misused-spread
        where: { ...options.where, id } as any
      });
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async create(data: Create): Promise<Entity> {
    this.logger.debug(`${this.name}::create`, { data: { data } });
    const attr = { entity: this.name, operation: "create" };
    let status = "success";
    const start = Date.now();
    try {
      return await this.repository.save(this.repository.create(data));
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
      return await this.repository.save(this.repository.create(data));
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
      const entity = this.repository.create(data);
      return await this.repository.save(entity);
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
      const entities = this.repository.create(data);
      return await this.repository.save(entities);
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async update(id: string, data: Update): Promise<Entity | null> {
    this.logger.debug(`${this.name}::update`, { data: { id, data } });
    const attr = { entity: this.name, operation: "update" };
    let status = "success";
    const start = Date.now();
    try {
      const entity = await this.repository.findOne({ where: { id } as any });
      if (!entity) {
        return null;
      }
      Object.assign(entity, data);
      return await this.repository.save(entity);
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async updateIndexed(filter: Filter<Entity>, data: Update): Promise<Entity[]> {
    this.logger.debug(`${this.name}::updateIndexed`, { data: { filter: data } });
    const attr = { entity: this.name, operation: "update_indexed" };
    let status = "success";
    const start = Date.now();
    try {
      const typeormFindOptions = parseFilter(filter);
      const entities = await this.repository.find({ where: typeormFindOptions });
      if (entities.length === 0) {
        return [];
      }
      const updates = entities.map(entity => ({
        ...entity,
        // eslint-disable-next-line @typescript-eslint/no-misused-spread
        ...data
      }));
      return await this.repository.save(updates);
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
    const attr = { entity: this.name, operation: "delete_by_id" };
    let status = "success";
    const start = Date.now();
    try {
      const entity = await this.repository.findOne({ where: { id } as any });
      if (entity) {
        await this.repository.remove(entity);
      }
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
      const typeormFindOptions = parseFilter(filter);
      const entities = await this.repository.find({ where: typeormFindOptions });
      if (entities.length > 0) {
        await this.repository.remove(entities);
      }
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }
}
