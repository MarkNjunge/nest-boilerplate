import { EntityManager, FindOneOptions, MoreThan, LessThan, ObjectLiteral, Repository } from "typeorm";
import { mapQueryToTypeorm } from "@/lib/crud/query/typeorm-query-mapper";
import { Query } from "@/lib/crud/query/query";
import { CursorPaginationResult } from "@/lib/crud/query/cursor-pagination";
import { Logger } from "@/logging/Logger";
import opentelemetry, { Counter, Histogram } from "@opentelemetry/api";
import { ErrorCodes, HttpException } from "@/utils";
import { snakeCase } from "@/lib/crud/utils/snake-case";

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
        description: "CRUD operation duration",
        advice: {
          explicitBucketBoundaries: [0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
        }
      })
    };
  }

  withTransaction(manager: EntityManager): this {
    const txRepo = manager.getRepository(this.repository.target);
    const clone = Object.create(this) as this;
    Object.defineProperty(clone, "repository", { value: txRepo, writable: false });
    Object.defineProperty(clone, "logger", {
      value: new Logger(`CRUD:${this.name}:TX`),
      writable: false,
    });
    return clone;
  }

  protected async track<T>(
    method: string,
    logData: Record<string, unknown>,
    fn: () => Promise<T>
  ): Promise<T> {
    this.logger.debug(`${this.name}::${method}`, { data: logData });
    const attr = { entity: this.name, operation: snakeCase(method) };
    let status = "success";
    const start = Date.now();
    try {
      return await fn();
    } catch (e) {
      status = "failure";
      throw e;
    } finally {
      this.metrics.operation.add(1, { ...attr, status });
      this.metrics.duration.record((Date.now() - start) / 1000, attr);
    }
  }

  async count(query: Query<Entity>) {
    return this.track("count", { query }, () => this.repository.count(mapQueryToTypeorm(query)));
  }

  async list(query: Query<Entity> = {}): Promise<Entity[]> {
    return this.track("list", { query }, () => this.repository.find(mapQueryToTypeorm(query)));
  }

  async get(query: Query<Entity> = {}): Promise<Entity | null> {
    return this.track("get", { query }, () =>
      this.repository.findOne(mapQueryToTypeorm(query) as FindOneOptions<Entity>)
    );
  }

  async getById(id: string, query: Query<Entity> = {}): Promise<Entity | null> {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (id == null) {
      throw new Error("null id passed in update");
    }
    return this.track("getById", { query }, () => {
      const options = mapQueryToTypeorm(query) as FindOneOptions<Entity>;
      return this.repository.findOne({
        ...options,
        // eslint-disable-next-line @typescript-eslint/no-misused-spread
        where: { ...options.where, id } as any
      });
    });
  }

  async listCursor(query: Query<Entity> = {}): Promise<CursorPaginationResult<Entity>> {
    return this.track("listCursor", { query }, async () => {
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
    });
  }

}
