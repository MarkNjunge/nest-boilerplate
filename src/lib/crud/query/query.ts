import * as typeorm from "typeorm";
import {
  IsOptional,
  registerDecorator,
  ValidationArguments,
  ValidationOptions
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ErrorCodes, HttpException } from "@/utils";
import { DEFAULT_ROW_LIMIT, MAX_ROW_LIMIT } from "@/lib/crud/utils/crud-consts";

export type FilterOp = "eq"
  | "ne"
  | "like"
  | "ilike"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "in"
  | "notin"
  | "isnull"
  | "isnotnull"
  | "between"
  | "notbetween"
  | "any"
  | "none"
  | "contains" // {field} contains {query}
  | "containedby" // {field} is a subset of {query}
  | "raw";
export const filterOpArr: readonly FilterOp[] = [
  "eq", "ne", "like", "ilike", "gt", "lt", "gte", "lte",
  "in", "notin", "isnull", "isnotnull", "between", "notbetween",
  "any", "none", "contains", "containedby",
  // "raw" // raw is intentionally excluded to prevent arbitrary SQL
] as const;

export interface KeyValuePair<T extends Record<string, any> = any> {
  key: keyof T;
  value: T[keyof T];
  secondValue?: T[keyof T];
}

export interface Filter<T extends Record<string, any> = any> {
  eq?: KeyValuePair<T>[];
  ne?: KeyValuePair<T>[];
  like?: KeyValuePair<T>[];
  ilike?: KeyValuePair<T>[];
  gt?: KeyValuePair<T>[];
  lt?: KeyValuePair<T>[];
  gte?: KeyValuePair<T>[];
  lte?: KeyValuePair<T>[];
  in?: KeyValuePair<T>[];
  notin?: KeyValuePair<T>[];
  isnull?: KeyValuePair<T>[];
  isnotnull?: KeyValuePair<T>[];
  between?: KeyValuePair<T>[];
  notbetween?: KeyValuePair<T>[];
  any?: KeyValuePair<T>[];
  none?: KeyValuePair<T>[];
  contains?: KeyValuePair<T>[];
  containedby?: KeyValuePair<T>[];
  raw?: KeyValuePair<T>[];
  or?: Filter<T>[];
  and?: Filter<T>[];
}

export function IsValidFilter(validationOptions?: ValidationOptions) {
  return function(object: object, propertyName: string) {
    registerDecorator({
      name: "isValidFilter",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          return validateFilter(value);
        },
        defaultMessage(validationArguments?: ValidationArguments): string {
          return `${propertyName} must match '(key,operand,value)'`;
        }
      }
    });
  };
}

export function validateFilter(s: string): boolean {
  if (s.length === 0) {
    return true;
  }

  const matches = s.match(/\([^)]+\)/g);

  // If no matches found, the filter is invalid
  if (!matches) {
    return false;
  }

  // Reconstruct the string from matches and check if it equals the original
  // This ensures no incomplete or extra characters exist
  const reconstructed = matches.join(":");
  if (reconstructed !== s) {
    return false;
  }

  return matches.every(s => {
    const { 0: key, 1: op, 2: value, 3: secondValue } = s.slice(1, -1).split(",");
    return s.startsWith("(") && s.endsWith(")") && filterOpArr.includes(op as FilterOp);
  });
}

/**
 * Resolves to a sortable type for a single property value type.
 * Uses a bare type parameter to force distributive conditional evaluation
 * over union types (e.g., Entity | undefined).
 */
type SortValue<V> = V extends object ?
  V extends readonly any[] ?
    "ASC" | "DESC" :
    "ASC" | "DESC" | Sort<V> :
  "ASC" | "DESC";

export type Sort<T = any> = {
  [P in keyof T]?: SortValue<T[P]>
};

/**
 * Resolves to a selectable type for a single property value type.
 * Uses a bare type parameter to force distributive conditional evaluation
 * over union types (e.g., Entity | undefined).
 *
 * - Functions → `never` (excluded, e.g. class methods like `toString`)
 * - Promises → unwrap and recurse (handles lazy-loaded relations)
 * - Arrays → unwrap element type and recurse
 * - Date, Uint8Array → `boolean` (treated as scalars)
 * - Other objects → nested `Select<V>` | `boolean`
 * - Primitives → `boolean`
 */
type SelectValue<V> = V extends Function ?
  never :
  V extends Promise<infer I> ?
    SelectValue<I> | boolean :
    V extends readonly (infer I)[] ?
      SelectValue<I> | boolean :
      V extends Date | Uint8Array ?
        boolean :
        V extends object ?
          Select<V> | boolean :
          boolean;

export type Select<T = any> = {
  [P in keyof T]?: P extends "toString" ? unknown : SelectValue<NonNullable<T[P]>>
};

export function IsValidSort(validationOptions?: ValidationOptions) {
  return function(object: object, propertyName: string) {
    registerDecorator({
      name: "isValidSort",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          return validateSort(value);
        },
        defaultMessage(validationArguments?: ValidationArguments): string {
          return `${propertyName} must match '(key.subkey,direction)'`;
        }
      }
    });
  };
}

export function validateSort(s: string): boolean {
  if (s.length === 0) {
    return true;
  }

  return s.split(":").every(s => {
    const { 0: key, 1: direction } = s.slice(1, -1).split(",");
    return s.startsWith("(") && s.endsWith(")") && ["ASC", "DESC"].includes(direction) && key?.length > 0;
  });
}

export class BaseRawQuery {
  @ApiProperty({ required: false, description: "Example: title,content" })
  @IsOptional()
  select?: string;

  @ApiProperty({ required: false, description: "Example: comments,comments.user" })
  @IsOptional()
  include?: string;
}

export class FilteredOnlyRawQuery {
  @ApiProperty({ required: false, description: "Example: (postId,eq,post_abc):(createdAt,lt,2025-11-04T06:55:40.549Z):(price,between,120,200)" })
  @IsOptional()
  @IsValidFilter()
  filter?: string;
}

export class FilteredRawQuery extends BaseRawQuery {
  @ApiProperty({ required: false, description: "Example: (postId,eq,post_abc):(createdAt,lt,2025-11-04T06:55:40.549Z):(price,between,120,200)" })
  @IsOptional()
  @IsValidFilter()
  filter?: string;
}

export class ListRawQuery extends FilteredRawQuery {
  @ApiProperty({ required: false, description: "Example: 10" })
  @IsOptional()
  limit?: string;

  @ApiProperty({ required: false, description: "Example: 20" })
  @IsOptional()
  offset?: string;

  @ApiProperty({ required: false, description: "Example: (averageRating,ASC):(price,DESC)" })
  @IsOptional()
  @IsValidSort()
  sort?: string;
}

export class CursorRawQuery extends FilteredRawQuery {
  @ApiProperty({ required: false, description: `Example: 10. Default = ${DEFAULT_ROW_LIMIT}, Max = ${MAX_ROW_LIMIT}` })
  @IsOptional()
  limit?: string;

  @ApiProperty({ required: false, description: "Fetch items greater than this cursor" })
  @IsOptional()
  after?: string;

  @ApiProperty({ required: false, description: "Fetch items less than this cursor" })
  @IsOptional()
  before?: string;

  @ApiProperty({ required: false, description: "Field to sort by. Defaults to id." })
  @IsOptional()
  sortField?: string;

  @ApiProperty({ required: false, description: "Sort direction: ASC or DESC. Defaults to ASC." })
  @IsOptional()
  sortDir?: "ASC" | "DESC";
}

export class RestrictedCursorRawQuery extends BaseRawQuery {
  @ApiProperty({ required: false, description: "Fetch items greater than this cursor" })
  @IsOptional()
  after?: string;

  @ApiProperty({ required: false, description: "Fetch items less than this cursor" })
  @IsOptional()
  before?: string;
}

export type RawQuery = ListRawQuery;

/**
 * Resolves to an includable type for a single property value type.
 * Uses a bare type parameter to force distributive conditional evaluation
 * over union types (e.g., Entity | undefined).
 *
 * Only object (relation) types are allowed — include does not work on direct columns.
 *
 * - Functions → `never` (excluded, e.g. class methods like `toString`)
 * - Promises → unwrap and recurse (handles lazy-loaded relations)
 * - Arrays → unwrap element type and recurse
 * - Date, Uint8Array → `never` (scalars, not relations)
 * - Other objects → nested `Include<V>` | `boolean`
 * - Primitives → `never` (not relations)
 */
type IncludeValue<V> = V extends Function ?
  never :
  V extends Promise<infer I> ?
    IncludeValue<I> | boolean :
    V extends readonly (infer I)[] ?
      IncludeValue<I> | boolean :
      V extends Date | Uint8Array ?
        never :
        V extends object ?
          Include<V> | boolean :
          never;

// Shallow, non-recursive check: is this key's type an object (potential relation)?
type IsRelation<T, K extends keyof T> =
  NonNullable<T[K]> extends Function ? false :
    NonNullable<T[K]> extends Date | Uint8Array ? false :
      NonNullable<T[K]> extends object ? true :
        false;

export type Include<T = any> = {
  [P in keyof T as P extends "toString" ? never : IsRelation<T, P> extends true ? P : never]?:
  IncludeValue<NonNullable<T[P]>>
};

export interface Query<T extends Record<string, any> = any> {
  select?: Select<T>;
  include?: Include<T>;
  filter?: Filter<T>;
  sort?: Sort<T>;
  limit?: number;
  offset?: number;
  after?: string;
  before?: string;
  sortField?: string;
  sortDir?: "ASC" | "DESC";
  rawOptions?: typeorm.FindManyOptions<T>;
}

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
