import { snakeCase } from "./snake-case";
import { Model } from "objection";
import * as Objection from "objection";

export interface QueryFilter {
  key: string;
  op: string;
  value: string;
}

type OrderByDirection = "asc" | "desc" | "ASC" | "DESC";

export interface QueryOrder {
  key: string;
  direction: OrderByDirection;
}

export interface Query {
  limit: number;
  page?: number;
  filters: QueryFilter[];
  orders: QueryOrder[];
}

export function parseQuery(reqQuery: any): Query {
  const filters: QueryFilter[] = [];
  const orders: QueryOrder[] = [];

  if (reqQuery.after) {
    filters.push({ key: "id", op: ">", value: reqQuery.after });
    orders.push({ key: "id", direction: "ASC" });
  }

  if (reqQuery.filter) {
    reqQuery.filter.split(":").forEach(f => {
      const match = f
        .replace(/[()]/g, "")
        .match(/(.*),(.*),(.*)/);

      if (!match) {
        return;
      }

      filters.push({ key: snakeCase(match[1]), op: match[2], value: match[3] });
    });
  }

  if (reqQuery.orderBy) {
    reqQuery.orderBy.split(":")
      .forEach(q => {
        const match = q
          .replace(/[()]/g, "")
          .match(/(.*),(.*)/);

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
  dbQuery: Objection.QueryBuilder<M, R>
): Objection.QueryBuilder<M, R> {
  if (query.page) {
    const offset = query.page == 1 ? 0 : (query.page - 1) * query.limit;
    dbQuery = dbQuery.offset(offset);
  }

  for (const filter of query.filters) {
    if (filter.value === "null") {
      if (filter.op === "=") {
        dbQuery = dbQuery.whereNull(filter.key);
      } else {
        dbQuery = dbQuery.whereNotNull(filter.key);
      }
    } else {
      dbQuery = dbQuery.where(filter.key, filter.op, filter.value);
    }
  }

  for (const order of query.orders) {
    dbQuery = dbQuery.orderBy(order.key, order.direction);
  }

  dbQuery = dbQuery.limit(query.limit);

  return dbQuery;
}
