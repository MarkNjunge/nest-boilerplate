import { BaseService } from "@/db/crud/base.service";
import { ObjectLiteral } from "typeorm";
import {
  Get,
  Param,
  Query
} from "@nestjs/common";
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath
} from "@nestjs/swagger";
import { parseRawQuery, RawQuery } from "@/db/query/query";
import { CursorPaginationResult, PageInfo } from "@/db/query/cursor-pagination";
import { HttpException } from "@/utils";

export function BaseController<Entity extends ObjectLiteral>(
  entityType: new () => Entity
) {
  class BaseControllerHost {
    constructor(
      readonly service: BaseService<Entity>
    ) {}

    @Get("/count")
    @ApiOperation({ summary: "Count entities matching the query" })
    @ApiResponse({ status: 200, type: Number })
    async count(@Query() query: RawQuery): Promise<number> {
      return this.service.count(parseRawQuery(query));
    }

    @Get("/")
    @ApiOperation({ summary: "List entities matching the query" })
    @ApiResponse({ status: 200, type: entityType, isArray: true })
    async list(@Query() query: RawQuery): Promise<Entity[]> {
      return this.service.list(parseRawQuery(query));
    }

    @Get("/first")
    @ApiOperation({ summary: "Get the first entity matching the query" })
    @ApiResponse({ status: 200, type: entityType })
    async get(@Query() query: RawQuery): Promise<Entity | null> {
      const result = await this.service.get(parseRawQuery(query));
      if (!result) {
        throw new HttpException(404, "Entity not found");
      }
      return result;
    }

    @Get("/cursor")
    @ApiOperation({ summary: "List entities with cursor-based pagination" })
    @ApiExtraModels(PageInfo)
    @ApiResponse({
      status: 200,
      description: "Paginated list with cursor info",
      schema: {
        properties: {
          data: { type: "array", items: { $ref: getSchemaPath(entityType) } },
          pageInfo: { $ref: getSchemaPath(PageInfo) }
        }
      }
    })
    async listCursor(@Query() query: RawQuery): Promise<CursorPaginationResult<Entity>> {
      return this.service.listCursor(parseRawQuery(query, true));
    }

    @Get("/:id")
    @ApiParam({ name: "id", type: String })
    @ApiOperation({ summary: "Get an entity by id" })
    @ApiResponse({ status: 200, type: entityType })
    async getById(
      @Param("id") id: string,
      @Query() query: RawQuery
    ): Promise<Entity | null> {
      const result = await this.service.getById(id, parseRawQuery(query));
      if (!result) {
        throw new HttpException(404, `Entity ${id} not found`);
      }
      return result;
    }
  }

  return BaseControllerHost;
}
