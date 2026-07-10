import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { IsValidFilter, IsValidSort } from "@/lib/crud/query/query.validator";
import { DEFAULT_ROW_LIMIT, MAX_ROW_LIMIT } from "@/lib/crud/utils/crud-consts";

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

export class PageInfo {
  @ApiProperty({ description: "Whether there are more items after the last cursor" })
  hasNextPage: boolean;

  @ApiProperty({ description: "Whether there are more items before the first cursor" })
  hasPreviousPage: boolean;

  @ApiProperty({ description: "Cursor of the first item in the result", nullable: true, type: String })
  startCursor: string | null;

  @ApiProperty({ description: "Cursor of the last item in the result", nullable: true, type: String })
  endCursor: string | null;
}

export class CursorPaginationResult<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty({ type: PageInfo })
  @Type(() => PageInfo)
  pageInfo: PageInfo;
}
