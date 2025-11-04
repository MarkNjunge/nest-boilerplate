import * as typeorm from "typeorm";
import { Filter, FilterOp, Query } from "@/db/query/query";

export function mapFilterOp(op: FilterOp, value: any, secondValue?: any) {
  switch (op) {
    case "eq":
      return typeorm.Equal(value);
    case "ne":
      return typeorm.Not(value);
    case "like":
      return typeorm.Like(value);
    case "ilike":
      return typeorm.ILike(value);
    case "gt":
      return typeorm.MoreThan(value);
    case "lt":
      return typeorm.LessThan(value);
    case "gte":
      return typeorm.MoreThanOrEqual(value);
    case "lte":
      return typeorm.LessThanOrEqual(value);
    case "in":
      return typeorm.In(value);
    case "notin":
      return typeorm.Not(typeorm.In(value));
    case "isnull":
      return typeorm.IsNull();
    case "isnotnull":
      return typeorm.Not(typeorm.IsNull());
    case "between":
      if (secondValue === undefined) {
        throw new Error("secondValue is required for 'between' operator");
      }
      return typeorm.Between(value, secondValue);
    case "notbetween":
      if (secondValue === undefined) {
        throw new Error("secondValue is required for 'notbetween' operator");
      }
      return typeorm.Not(typeorm.Between(value, secondValue));
    case "any":
      return typeorm.Any(value);
    case "none":
      return typeorm.Not(typeorm.Any(value));
    case "contains":
      return typeorm.ArrayContains(Array.isArray(value) ? value : [value]);
    case "containedby":
      return typeorm.ArrayContainedBy(Array.isArray(value) ? value : [value]);
    case "raw":
      return typeorm.Raw(() => value, secondValue);
  }
}

export function parseFilter<T extends Record<string, any> = any>(filter: Filter<T>): typeorm.FindOptionsWhere<T> {
  const where: typeorm.FindOptionsWhere<any> = {};

  if (filter.or && filter.or.length > 0) {
    return filter.or.map(f => parseFilter(f)) as any;
  }

  if (filter.and && filter.and.length > 0) {
    return filter.and.reduce<typeorm.FindOptionsWhere<any>>((acc, f) => {
      const parsed = parseFilter(f) as typeorm.FindOptionsWhere<any>;
      Object.keys(parsed).forEach(key => {
        if (acc[key] != null) {
          const prevElement: typeorm.FindOperator<any> = acc[key];
          if (prevElement.type === "and") {
            acc[key] = typeorm.And(...prevElement.value, parsed[key]);
          } else {
            acc[key] = typeorm.And(prevElement, parsed[key]);
          }
        } else {
          acc[key] = parsed[key];
        }
      });
      return acc;
    }, {});
  }

  Object.keys(filter).forEach((op: FilterOp) => {
    filter[op]?.forEach(({ key, value, secondValue }) => {
      if (where[key]) {
        const prevElement: typeorm.FindOperator<any> = where[key];
        if (prevElement.type === "and") {
          where[key] = typeorm.And(...prevElement.value, mapFilterOp(op, value, secondValue));
        } else {
          where[key] = typeorm.And(prevElement, mapFilterOp(op, value, secondValue));
        }
      } else {
        where[key] = mapFilterOp(op, value, secondValue);
      }
    });
  });

  return where;
}

export function mapQueryToTypeorm<T extends Record<string, any> = any>(options: Query<T>): typeorm.FindManyOptions {
  let where: typeorm.FindOptionsWhere<T> = {};
  if (options.filter) {
    where = parseFilter(options.filter);
  }

  const relations: Record<string, any> = {};

  options.include?.forEach(field => {
    const parts = field.split(".");
    let current = relations;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        current[part] = true;
      } else {
        if (!current[part] || typeof current[part] !== "object") {
          current[part] = {};
        }
        current = current[part];
      }
    });
  });

  return {
    select: options.select,
    relations,
    where,
    order: options.sort,
    skip: options.offset,
    take: options.limit,
    ...options.rawOptions
  };
}
