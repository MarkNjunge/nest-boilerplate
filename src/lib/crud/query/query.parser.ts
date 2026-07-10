import { ErrorCodes, HttpException } from "@/utils";
import { DEFAULT_ROW_LIMIT, MAX_ROW_LIMIT } from "@/lib/crud/utils/crud-consts";
import { Filter, FilterOp, KeyValuePair, Query, Sort } from "@/lib/crud/query/query.type";
import { CursorRawQuery, ListRawQuery } from "@/lib/crud/query/query.dto";

export function parseRawFilter(filterStr: string | undefined): Filter {
  const filter: Filter = {};

  if (!filterStr) {
    return filter;
  }

  const match = filterStr.match(/\([^)]+\)/g);
  if (!match) {
    return filter;
  }

  match.map(s => {
    const { 0: key, 1: op, 3: secondValue } = s.slice(1, -1).split(",");
    let value: string | string[] = s.slice(1, -1).split(",")[2];
    filter[op as FilterOp] ??= [];

    if (value.includes("|")) {
      value = value.split("|");
    }

    const kv: KeyValuePair = { key, value };
    if (secondValue) {
      kv.secondValue = secondValue;
    }

    filter[op as FilterOp]?.push(kv);
  });

  return filter;
}

export function parseRawSort(sortStr: string): Sort {
  const sort: Sort = {};
  const match = sortStr.match(/\([^)]+\)/g);
  if (match) {
    match.map((s: string) => {
      const { 0: key, 1: direction } = s.slice(1, -1).split(",");
      setNestedSort(sort, key, direction as "ASC" | "DESC");
    });
  }
  return sort;
}

function setNestedSort(sort: Sort, keyPath: string, direction: "ASC" | "DESC"): void {
  const parts = keyPath.split(".");
  let current: Record<string, any> = sort;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== "object" || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = direction;
}

export function parseRawQuery(rawQuery: ListRawQuery | CursorRawQuery, cursor = false): Query {
  const query: Query = {};

  if (rawQuery.select) {
    const fields = rawQuery.select.split(",").map(s => s.trim());

    query.select = fields.reduce<any>((acc, field) => {
      const parts = field.split(".");
      let current = acc;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // Last part: set to true
          current[part] = true;
        } else {
          // Intermediate part: create nested object if it doesn't exist
          if (!current[part] || typeof current[part] !== "object") {
            current[part] = {};
          }
          current = current[part];
        }
      });

      return acc;
    }, {});
  }

  if (rawQuery.include) {
    const includeFields = rawQuery.include.split(",").map(s => s.trim());

    query.include = includeFields.reduce<any>((acc, field) => {
      const parts = field.split(".");
      let current = acc;

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

      return acc;
    }, {});
  }

  if (rawQuery.filter) {
    query.filter = parseRawFilter(rawQuery.filter);
  }

  // Sort and offset are only used for offset-based pagination
  if (!cursor) {
    const listQuery = rawQuery as ListRawQuery;
    if (listQuery.sort) {
      query.sort = parseRawSort(listQuery.sort);
    }

    if (listQuery.offset) {
      query.offset = parseInt(listQuery.offset);
      if (Number.isNaN(query.offset)) {
        throw new HttpException(400, `${listQuery.offset} is not a valid number`, ErrorCodes.CLIENT_ERROR);
      }
    }
  }

  if (rawQuery.limit) {
    query.limit = parseInt(rawQuery.limit);
    if (Number.isNaN(query.limit)) {
      throw new HttpException(400, `${rawQuery.limit} is not a valid number`, ErrorCodes.CLIENT_ERROR);
    }
  } else {
    query.limit = DEFAULT_ROW_LIMIT;
  }
  if (query.limit > MAX_ROW_LIMIT) {
    throw new HttpException(400, `Max query limit exceeded: ${query.limit} vs ${MAX_ROW_LIMIT}`, ErrorCodes.CLIENT_ERROR);
  }

  // Cursor fields are only used for cursor-based pagination
  if (cursor) {
    const cursorQuery = rawQuery as CursorRawQuery;
    query.after = cursorQuery.after;
    query.before = cursorQuery.before;
    query.sortField = cursorQuery.sortField ?? "id";
    query.sortDir = cursorQuery.sortDir ?? "ASC";
  }

  return query;
}
