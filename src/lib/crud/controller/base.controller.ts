import { BaseService } from "@/lib/crud/service/base.service";
import { ObjectLiteral } from "typeorm";
import {
  Get,
  Param,
  Query,
  SetMetadata,
  UseGuards
} from "@nestjs/common";
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  getSchemaPath
} from "@nestjs/swagger";
import { parseRawQuery, ListRawQuery, CursorRawQuery } from "@/lib/crud/query/query";
import { CursorPaginationResult, PageInfo } from "@/lib/crud/query/cursor-pagination";
import { HttpException } from "@/utils";
import { ReqCtx } from "@/decorators/request-context.decorator";
import { ICrudContext } from "@/lib/crud/utils/context";
import { AUTH_MODE_KEY, AuthGuard } from "@/guards/auth.guard";

export type BaseRouteNames = "count" | "list" | "get" | "listCursor" | "getById";

export type AuthConfig = false | { mode?: string; publicReads?: boolean };

export interface ControllerOptions<T extends string> {
  exclude?: T[];
  auth?: AuthConfig;
}

export function BaseController<
  Entity extends ObjectLiteral,
  TService extends BaseService<Entity> = BaseService<Entity>
>(
  entityType: new () => Entity,
  options?: ControllerOptions<BaseRouteNames>
) {
  class BaseControllerHost {
    constructor(
      readonly service: TService
    ) {}

    @Get("/count")
    @ApiOperation({ summary: "Count entities matching the query" })
    @ApiResponse({ status: 200, type: Number })
    async count(@ReqCtx() ctx: ICrudContext, @Query() query: ListRawQuery): Promise<number> {
      return this.service.count(ctx, parseRawQuery(query));
    }

    @Get("/")
    @ApiOperation({ summary: "List entities matching the query" })
    @ApiResponse({ status: 200, type: entityType, isArray: true })
    async list(@ReqCtx() ctx: ICrudContext, @Query() query: ListRawQuery): Promise<Entity[]> {
      return this.service.list(ctx, parseRawQuery(query));
    }

    @Get("/first")
    @ApiOperation({ summary: "Get the first entity matching the query" })
    @ApiResponse({ status: 200, type: entityType })
    async get(@ReqCtx() ctx: ICrudContext, @Query() query: ListRawQuery): Promise<Entity | null> {
      const result = await this.service.get(ctx, parseRawQuery(query));
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
    async listCursor(@ReqCtx() ctx: ICrudContext, @Query() query: CursorRawQuery): Promise<CursorPaginationResult<Entity>> {
      return this.service.listCursor(ctx, parseRawQuery(query, true));
    }

    @Get("/:id")
    @ApiParam({ name: "id", type: String })
    @ApiOperation({ summary: "Get an entity by id" })
    @ApiResponse({ status: 200, type: entityType })
    async getById(
      @ReqCtx() ctx: ICrudContext,
      @Param("id") id: string,
      @Query() query: ListRawQuery
    ): Promise<Entity | null> {
      const result = await this.service.getById(ctx, id, parseRawQuery(query));
      if (!result) {
        throw new HttpException(404, `Entity ${id} not found`);
      }
      return result;
    }
  }

  if (options?.exclude) {
    for (const method of options.exclude) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (BaseControllerHost.prototype as any)[method];
    }
  }

  const authConfig = options?.auth;
  const publicReads = authConfig !== false && authConfig?.publicReads;

  if (publicReads) {
    // Empty guard list
  } else if (authConfig !== false) {
    UseGuards(AuthGuard)(BaseControllerHost);
    ApiSecurity("api-key")(BaseControllerHost);

    if (authConfig?.mode) {
      SetMetadata(AUTH_MODE_KEY, authConfig.mode)(BaseControllerHost);
    }
  }

  return BaseControllerHost;
}
