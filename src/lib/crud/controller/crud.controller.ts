import { CrudService } from "@/lib/crud/service/crud.service";
import { DeepPartial } from "typeorm";
import {
  Body,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity
} from "@nestjs/swagger";
import { parseRawFilter } from "@/lib/crud/query/query";
import { AuthGuard } from "@/guards/auth.guard";
import { ErrorCodes, HttpException } from "@/utils";
import { BaseController, BaseRouteNames, ControllerOptions } from "@/lib/crud/controller/base.controller";
import { BaseEntity } from "@/lib/crud";
import { ReqCtx } from "@/decorators/request-context.decorator";
import { ICrudContext } from "@/lib/crud/utils/context";
import { DeletedDto } from "@/lib/crud/utils/deleted.dto";

export type CrudRouteNames = "create" | "createBulk" | "upsert" | "upsertBulk" | "updateIndexed" | "update" | "deleteIndexed" | "deleteById";

export function CrudController<Entity extends BaseEntity>(
  entityType: new () => Entity,
  createDtoType?: new () => any,
  updateDtoType?: new () => any,
  options?: ControllerOptions<BaseRouteNames | CrudRouteNames>
) {
  const baseExclude = options?.exclude?.filter(
    (m): m is BaseRouteNames => ["count", "list", "get", "listCursor", "getById"].includes(m)
  );
  const BaseControllerClass = BaseController<Entity>(
    entityType,
    baseExclude?.length ? { exclude: baseExclude } : undefined
  );

  class CrudControllerHost<
    Create extends DeepPartial<Entity> = DeepPartial<Entity>,
    Update extends DeepPartial<Entity> = DeepPartial<Entity>
  > extends BaseControllerClass {
    declare readonly service: CrudService<Entity, Create, Update>;

    @Post("/")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiOperation({ summary: "Create an entity" })
    @ApiBody({ type: createDtoType })
    @ApiResponse({ status: 201, type: entityType })
    async create(@ReqCtx() ctx: ICrudContext, @Body() dto: Create): Promise<Entity> {
      return this.service.create(ctx, dto);
    }

    @Post("/bulk")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiOperation({ summary: "Create entities in bulk" })
    @ApiBody({ type: createDtoType, isArray: true })
    @ApiResponse({ status: 201, type: entityType, isArray: true })
    async createBulk(@ReqCtx() ctx: ICrudContext, @Body() dto: Create[]): Promise<Entity[]> {
      return this.service.createBulk(ctx, dto);
    }

    @Put("/")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiOperation({ summary: "Create or update entity (upsert)" })
    @ApiBody({ type: createDtoType })
    @ApiResponse({ status: 200, type: entityType })
    async upsert(@ReqCtx() ctx: ICrudContext, @Body() dto: Create): Promise<Entity> {
      return this.service.upsert(ctx, dto);
    }

    @Put("/bulk")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiOperation({ summary: "Create or update multiple entities (upsert)" })
    @ApiBody({ type: createDtoType, isArray: true })
    @ApiResponse({ status: 200, type: entityType, isArray: true })
    async upsertBulk(@ReqCtx() ctx: ICrudContext, @Body() dto: Create[]): Promise<Entity[]> {
      return this.service.upsertBulk(ctx, dto);
    }

    @Patch("/")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiOperation({ summary: "Update multiple entities by filter" })
    @ApiQuery({
      name: "filter",
      description: "Example: (postId,eq,post_):(createdAt,lt,2025-11-04T06:55:40.549Z):(price,between,120,200)"
    })
    @ApiBody({ type: updateDtoType })
    @ApiResponse({ status: 200, type: entityType, isArray: true })
    async updateIndexed(
      @ReqCtx() ctx: ICrudContext,
      @Query("filter") filter: string,
      @Body() dto: Update
    ): Promise<Entity[]> {
      if (!filter) {
        throw new HttpException(400, "filter query is required", ErrorCodes.CLIENT_ERROR);
      }

      return this.service.updateIndexed(ctx, parseRawFilter(filter), dto);
    }

    @Patch("/:id")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiParam({ name: "id", type: String })
    @ApiOperation({ summary: "Update an entity" })
    @ApiBody({ type: updateDtoType })
    @ApiResponse({ status: 200, type: entityType })
    async update(
      @ReqCtx() ctx: ICrudContext,
      @Param("id") id: string,
      @Body() dto: Update
    ): Promise<Entity> {
      const result = await this.service.update(ctx, id, dto);
      if (!result) {
        throw new HttpException(404, `Entity ${id} not found`);
      }
      return result;
    }

    @Delete("/")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiOperation({ summary: "Delete multiple entities by filter" })
    @ApiQuery({
      name: "filter",
      description: "Example: (postId,eq,post_):(createdAt,lt,2025-11-04T06:55:40.549Z):(price,between,120,200)"
    })
    @HttpCode(200)
    @ApiResponse({ status: 200, type: DeletedDto })
    async deleteIndexed(@ReqCtx() ctx: ICrudContext, @Query("filter") filter: string): Promise<DeletedDto> {
      if (!filter) {
        throw new HttpException(400, "filter query is required", ErrorCodes.CLIENT_ERROR);
      }

      const affected = await this.service.deleteIndexed(ctx, parseRawFilter(filter));
      return {
        affected
      };
    }

    @Delete("/:id")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiParam({ name: "id", type: String })
    @ApiOperation({ summary: "Delete an entity by id" })
    @HttpCode(200)
    @ApiResponse({ status: 200, type: DeletedDto })
    async deleteById(@ReqCtx() ctx: ICrudContext, @Param("id") id: string): Promise<DeletedDto> {
      const affected = await this.service.deleteById(ctx, id);
      return {
        affected
      };
    }
  }

  const excluded = new Set(options?.exclude);

  // Override metadata after class creation
  if (createDtoType) {
    for (const method of ["create", "createBulk", "upsert", "upsertBulk"] as const) {
      if (!excluded.has(method)) {
        Reflect.defineMetadata("design:paramtypes", [Object, createDtoType], CrudControllerHost.prototype, method);
      }
    }
  }

  if (updateDtoType) {
    if (!excluded.has("update")) {
      Reflect.defineMetadata("design:paramtypes", [Object, String, updateDtoType], CrudControllerHost.prototype, "update");
    }
    if (!excluded.has("updateIndexed")) {
      Reflect.defineMetadata("design:paramtypes", [Object, String, updateDtoType], CrudControllerHost.prototype, "updateIndexed");
    }
  }

  // Delete excluded crud methods from prototype
  for (const method of excluded) {
    if (method in CrudControllerHost.prototype) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (CrudControllerHost.prototype as any)[method];
    }
  }

  return CrudControllerHost;
}
