import { snakeCase } from "./snake-case";
import { Model } from "objection";
import * as Objection from "objection";

export interface QueryFilter<T extends Record<string, any> = any> {
  key: string | keyof T;
  op: string;
  value: any;
}

type OrderByDirection = "asc" | "desc" | "ASC" | "DESC";

export interface QueryOrder<T extends Record<string, any> = any> {
  key: string | keyof T;
  direction: OrderByDirection;
}

export interface Query<T extends Record<string, any> = any> {
  limit: number;
  page?: number;
  filters?: QueryFilter<T>[];
  orders?: QueryOrder<T>[];
}

export const blankQuery = (limit = 10): Query => ({
  limit,
  filters: [],
  orders: [],
});

export function parseQuery<T extends Record<string, any> = any>(reqQuery: any): Query<T> {
  const filters: QueryFilter[] = [];
  const orders: QueryOrder[] = [];

  // TODO Implement properly
  if (reqQuery.after) {
    filters.push({ key: "id", op: ">", value: reqQuery.after });
    orders.push({ key: "id", direction: "ASC" });
  }

  if (reqQuery.filter) {
    reqQuery.filter.split(":").forEach(f => {
      const match = f.replace(/[()]/g, "").match(/(.*),(.*),(.*)/);

      if (!match) {
        return;
      }

      filters.push({ key: snakeCase(match[1]), op: match[2], value: match[3] });
    });
  }

  if (reqQuery.orderBy) {
    reqQuery.orderBy.split(":").forEach(q => {
      const match = q.replace(/[()]/g, "").match(/(.*),(.*)/);

      if (!match) {
        return;
      }

      orders.push({ key: snakeCase(match[1]), direction: match[2] });
    });
  }

  const limit = reqQuery.limit ? parseInt(reqQuery.limit) : 20;
  const page = reqQuery.page ? parseInt(reqQuery.page) : undefined; // Explicitly undefined

  return {
    limit,
    page,
    filters,
    orders,
  };
}

export function applyQuery<M extends Model, R = M[]>(
  query: Query,
  dbQuery: Objection.QueryBuilder<M, R>,
): Objection.QueryBuilder<M, R> {
  if (query.page) {
    const offset = query.page == 1 ? 0 : (query.page - 1) * query.limit;
    dbQuery = dbQuery.offset(offset);
  }

  for (const filter of (query.filters ?? [])) {
    if (filter.value === "null") {
      if (filter.op === "=") {
        dbQuery = dbQuery.whereNull(filter.key as string);
      } else {
        dbQuery = dbQuery.whereNotNull(filter.key as string);
      }
    } else {
      dbQuery = dbQuery.where(filter.key as string, filter.op, filter.value);
    }
  }

  for (const order of (query.orders ?? [])) {
    dbQuery = dbQuery.orderBy(order.key as string, order.direction);
  }

  dbQuery = dbQuery.limit(query.limit);

  return dbQuery;
}
