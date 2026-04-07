import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

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
