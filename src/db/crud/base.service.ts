import { FindOneOptions, ObjectLiteral, Repository } from "typeorm";
import { mapQueryToTypeorm } from "@/db/query/typeorm-query-mapper";
import { Query } from "@/db/query/query";
import { Logger } from "@/logging/Logger";
import opentelemetry, { Counter, Histogram } from "@opentelemetry/api";

export class BaseService<
  Entity extends ObjectLiteral
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

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (id == null) {
      throw new Error("null id passed in update");
    }

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

}
