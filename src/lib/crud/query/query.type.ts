import * as typeorm from "typeorm";
import { ListRawQuery } from "@/lib/crud";

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

