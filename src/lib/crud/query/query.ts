import * as typeorm from "typeorm";
import {
  IsOptional,
  registerDecorator,
  ValidationArguments,
  ValidationOptions
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ErrorCodes, HttpException } from "@/utils";

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
  "any", "none", "contains", "containedby", "raw"
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

export type Sort<T extends Record<string, any> = any> = Partial<{
  [P in keyof T]: "ASC" | "DESC"
}>;

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
          return `${propertyName} must match '(key,direction)'`;
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
    return s.startsWith("(") && s.endsWith(")") && ["ASC", "DESC"].includes(direction);
  });
}

export class BaseRawQuery {
  @ApiProperty({ required: false, description: "Example: title,content" })
  @IsOptional()
  select?: string;

  @ApiProperty({ required: false, description: "Example: comments" })
  @IsOptional()
  include?: string;

  @ApiProperty({ required: false, description: "Example: (postId,eq,post_):(createdAt,lt,2025-11-04T06:55:40.549Z):(price,between,120,200)" })
  @IsOptional()
  @IsValidFilter()
  filter?: string;

  @ApiProperty({ required: false, description: "Example: 10" })
  @IsOptional()
  limit?: string;
}

export class ListRawQuery extends BaseRawQuery {
  @ApiProperty({ required: false, description: "Example: 20" })
  @IsOptional()
  offset?: string;

  @ApiProperty({ required: false, description: "Example: (averageRating,ASC):(price,DESC)" })
  @IsOptional()
  @IsValidSort()
  sort?: string;
}

export class CursorRawQuery extends BaseRawQuery {
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

export type RawQuery = ListRawQuery;

export interface Query<T extends Record<string, any> = any> {
  select?: typeorm.FindOptionsSelect<T>;
  include?: string[] | (keyof T)[];
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
    const { 0: key, 1: op, 2: value, 3: secondValue } = s.slice(1, -1).split(",");
    filter[op as FilterOp] ??= [];

    const kv: KeyValuePair = { key, value };
    if (secondValue) {
      kv.secondValue = secondValue;
    }

    filter[op as FilterOp]?.push(kv);
  });

  return filter;
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
    query.include = rawQuery.include.split(",").map(s => s.trim());
  }

  if (rawQuery.filter) {
    query.filter = parseRawFilter(rawQuery.filter);
  }

  // Sort and offset are only used for offset-based pagination
  if (!cursor) {
    const listQuery = rawQuery as ListRawQuery;
    if (listQuery.sort) {
      const sort: Sort = {};
      const match = listQuery.sort.match(/\([^)]+\)/g);
      if (match) {
        match.map((s: string) => {
          const { 0: key, 1: direction } = s.slice(1, -1).split(",");
          sort[key] = direction as "ASC" | "DESC";
        });
      }
      query.sort = sort;
    }

    if (listQuery.offset) {
      query.offset = parseInt(listQuery.offset);
    }
  }

  if (rawQuery.limit) {
    query.limit = parseInt(rawQuery.limit);
  } else {
    query.limit = 20;
  }
  const maxQueryLimit = 99;
  if (query.limit > maxQueryLimit) {
    throw new HttpException(400, `Max query limit exceeded: ${query.limit} vs ${maxQueryLimit}`, ErrorCodes.CLIENT_ERROR);
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
