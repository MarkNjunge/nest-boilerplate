import { FindOneOptions, MoreThan, LessThan, ObjectLiteral, Repository } from "typeorm";
import { mapQueryToTypeorm } from "@/db/query/typeorm-query-mapper";
import { Query } from "@/db/query/query";
import { CursorPaginationResult } from "@/db/query/cursor-pagination";
import { Logger } from "@/logging/Logger";
import opentelemetry, { Counter, Histogram } from "@opentelemetry/api";
import { ErrorCodes, HttpException } from "@/utils";

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

  async listCursor(query: Query<Entity> = {}): Promise<CursorPaginationResult<Entity>> {
    this.logger.debug(`${this.name}::listCursor`, { data: { query } });
    const attr = { entity: this.name, operation: "list_cursor" };
    let status = "success";
    const start = Date.now();

    try {
      const { after, before, limit = 20, ...restQuery } = query;

      if (after && before) {
        throw new HttpException(400, "Cannot use both 'after' and 'before' cursors", ErrorCodes.CLIENT_ERROR);
      }

      // Fetch limit + 1 to check for more pages
      const typeormOptions = mapQueryToTypeorm({ ...restQuery, limit: limit + 1 });

      // Apply cursor filter and force id sort (cursor pagination always sorts by id)
      if (after) {
        // eslint-disable-next-line @typescript-eslint/no-misused-spread
        typeormOptions.where = { ...typeormOptions.where, id: MoreThan(after) };
        typeormOptions.order = { id: "ASC" };
      } else if (before) {
        // eslint-disable-next-line @typescript-eslint/no-misused-spread
        typeormOptions.where = { ...typeormOptions.where, id: LessThan(before) };
        typeormOptions.order = { id: "DESC" };
      } else {
        typeormOptions.order = { id: "ASC" };
      }

      let items = await this.repository.find(typeormOptions);
      const hasMore = items.length > limit;
      if (hasMore) {
        items = items.slice(0, limit);
      }
      if (before) {
        items = items.reverse();
      }

      return {
        data: items,
        pageInfo: {
          hasNextPage: before ? true : hasMore,
          hasPreviousPage: after ? true : Boolean(before && hasMore),
          startCursor: items[0]?.id ?? null,
          endCursor: items[items.length - 1]?.id ?? null
        }
      };
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

}
