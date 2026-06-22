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
  SetMetadata,
  UseGuards
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity
} from "@nestjs/swagger";
import {
  FilteredOnlyRawQuery,
  parseRawFilter,
  parseRawQuery,
  BaseRawQuery,
  FilteredRawQuery
} from "@/lib/crud/query/query";
import { AuthGuard } from "@/guards/auth.guard";
import { AUTH_MODE_KEY } from "@/guards/auth.validator";
import { ErrorCodes, HttpException } from "@/utils";
import {
  BaseController,
  BaseRouteNames,
  BaseRoutesNamesArr,
  ControllerOptions
} from "@/lib/crud/controller/base.controller";
import { BaseEntity } from "@/lib/crud";
import { ReqCtx } from "@/decorators/request-context.decorator";
import { ICrudContext } from "@/lib/crud/utils/context";
import { DeletedDto } from "@/lib/crud/utils/deleted.dto";

export type CrudRouteNames = "create" | "createBulk" | "upsert" | "upsertBulk" | "updateIndexed" | "update" | "deleteIndexed" | "deleteById";

export function CrudController<
  Entity extends BaseEntity,
  Create extends DeepPartial<Entity> = DeepPartial<Entity>,
  Update extends DeepPartial<Entity> = DeepPartial<Entity>,
  TService extends CrudService<Entity> = CrudService<Entity>
>(
  entityType: new () => Entity,
  createDtoType: new () => Create,
  updateDtoType: new () => Update,
  options?: ControllerOptions<BaseRouteNames | CrudRouteNames>
) {
  const baseExclude = options?.exclude?.filter(
    (m): m is BaseRouteNames => (BaseRoutesNamesArr as string[]).includes(m)
  );
  const BaseControllerClass = BaseController<Entity>(
    entityType,
    {
      exclude: baseExclude,
      auth: options?.auth
    }
  );

  abstract class CrudControllerHost<
    Create extends DeepPartial<Entity> = DeepPartial<Entity>,
    Update extends DeepPartial<Entity> = DeepPartial<Entity>
  > extends BaseControllerClass {
    abstract readonly service: TService;

    @Post("/")
    @ApiOperation({ summary: "Create an entity" })
    @ApiBody({ type: createDtoType })
    @ApiResponse({ status: 201, type: entityType })
    async create(
      @ReqCtx() ctx: ICrudContext,
      @Body() dto: Create,
      @Query() query: BaseRawQuery
    ): Promise<Entity> {
      return this.service.create(ctx, dto, parseRawQuery(query));
    }

    @Post("/bulk")
    @ApiOperation({ summary: "Create entities in bulk" })
    @ApiBody({ type: createDtoType, isArray: true })
    @ApiResponse({ status: 201, type: entityType, isArray: true })
    async createBulk(
      @ReqCtx() ctx: ICrudContext,
      @Body() dto: Create[],
      @Query() query: BaseRawQuery
    ): Promise<Entity[]> {
      return this.service.createBulk(ctx, dto, parseRawQuery(query));
    }

    @Put("/")
    @ApiOperation({ summary: "Create or update entity (upsert)" })
    @ApiBody({ type: createDtoType })
    @ApiResponse({ status: 200, type: entityType })
    async upsert(
      @ReqCtx() ctx: ICrudContext,
      @Body() dto: Create,
      @Query() query: BaseRawQuery
    ): Promise<Entity> {
      return this.service.upsert(ctx, dto, parseRawQuery(query));
    }

    @Put("/bulk")
    @ApiOperation({ summary: "Create or update multiple entities (upsert)" })
    @ApiBody({ type: createDtoType, isArray: true })
    @ApiResponse({ status: 200, type: entityType, isArray: true })
    async upsertBulk(
      @ReqCtx() ctx: ICrudContext,
      @Body() dto: Create[],
      @Query() query: BaseRawQuery
    ): Promise<Entity[]> {
      return this.service.upsertBulk(ctx, dto, parseRawQuery(query));
    }

    @Patch("/")
    @ApiOperation({ summary: "Update multiple entities by filter" })
    @ApiBody({ type: updateDtoType })
    @ApiResponse({ status: 200, type: entityType, isArray: true })
    async updateIndexed(
      @ReqCtx() ctx: ICrudContext,
      @Query() query: FilteredRawQuery,
      @Body() dto: Update
    ): Promise<Entity[]> {
      if (!query.filter) {
        throw new HttpException(400, "filter query is required", ErrorCodes.CLIENT_ERROR);
      }

      return this.service.updateIndexed(ctx, parseRawFilter(query.filter), dto, parseRawQuery(query));
    }

    @Patch("/:id")
    @ApiParam({ name: "id", type: String })
    @ApiOperation({ summary: "Update an entity" })
    @ApiBody({ type: updateDtoType })
    @ApiResponse({ status: 200, type: entityType })
    async update(
      @ReqCtx() ctx: ICrudContext,
      @Param("id") id: string,
      @Body() dto: Update,
      @Query() query: BaseRawQuery
    ): Promise<Entity> {
      const result = await this.service.update(ctx, id, dto, parseRawQuery(query));
      if (!result) {
        throw new HttpException(404, `Entity ${id} not found`);
      }
      return result;
    }

    @Delete("/")
    @ApiOperation({ summary: "Delete multiple entities by filter" })
    @HttpCode(200)
    @ApiResponse({ status: 200, type: DeletedDto })
    async deleteIndexed(@ReqCtx() ctx: ICrudContext, @Query() query: FilteredOnlyRawQuery,): Promise<DeletedDto> {
      if (!query.filter) {
        throw new HttpException(400, "filter query is required", ErrorCodes.CLIENT_ERROR);
      }

      const affected = await this.service.deleteIndexed(ctx, parseRawFilter(query.filter));
      return {
        affected
      };
    }

    @Delete("/:id")
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

  // Override metadata for validation after class creation
  for (const method of ["create", "createBulk", "upsert", "upsertBulk"] as const) {
    if (!excluded.has(method)) {
      Reflect.defineMetadata("design:paramtypes", [Object, createDtoType, BaseRawQuery], CrudControllerHost.prototype, method);
    }
  }
  for (const method of ["update"] as const) {
    if (!excluded.has(method)) {
      Reflect.defineMetadata("design:paramtypes", [Object, String, updateDtoType, BaseRawQuery], CrudControllerHost.prototype, method);
    }
  }
  for (const method of ["updateIndexed"] as const) {
    if (!excluded.has(method)) {
      Reflect.defineMetadata("design:paramtypes", [Object, FilteredOnlyRawQuery, updateDtoType], CrudControllerHost.prototype, method);
    }
  }

  // Delete excluded crud methods from prototype
  for (const method of excluded) {
    if (method in CrudControllerHost.prototype) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (CrudControllerHost.prototype as any)[method];
    }
  }

  const authConfig = options?.auth;

  if (authConfig !== false) {
    const writeMethods: CrudRouteNames[] = [
      "create", "createBulk", "upsert", "upsertBulk",
      "updateIndexed", "update", "deleteIndexed", "deleteById",
    ];
    for (const method of writeMethods) {
      if (!(method in CrudControllerHost.prototype)) {
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(CrudControllerHost.prototype, method)!;
      UseGuards(AuthGuard)(CrudControllerHost.prototype, method, descriptor);
      ApiSecurity("api-key")(CrudControllerHost.prototype, method, descriptor);

      if (authConfig?.mode) {
        SetMetadata(AUTH_MODE_KEY, authConfig.mode)(CrudControllerHost.prototype, method, descriptor);
      }
    }
  }

  return CrudControllerHost;
}
