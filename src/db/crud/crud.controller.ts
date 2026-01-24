import { CrudService } from "@/db/crud/crud.service";
import { DeepPartial, ObjectLiteral } from "typeorm";
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
  ApiResponse,
  ApiSecurity
} from "@nestjs/swagger";
import { parseRawFilter } from "@/db/query/query";
import { AuthGuard } from "@/guards/auth.guard";
import { ErrorCodes, HttpException } from "@/utils";
import { BaseController } from "@/db/crud/base.controller";

export function CrudController<Entity extends ObjectLiteral>(
  entityType: new () => Entity,
  createDtoType?: new () => any,
  updateDtoType?: new () => any
) {
  const BaseControllerClass = BaseController<Entity>(entityType);

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
    async create(@Body() dto: Create): Promise<Entity> {
      return this.service.create(dto);
    }

    @Post("/bulk")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiOperation({ summary: "Create entities in bulk" })
    @ApiBody({ type: createDtoType, isArray: true })
    @ApiResponse({ status: 201, type: entityType, isArray: true })
    async createBulk(@Body() dto: Create[]): Promise<Entity[]> {
      return this.service.createBulk(dto);
    }

    @Put("/")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiOperation({ summary: "Create or update entity" })
    @ApiBody({ type: createDtoType })
    @ApiResponse({ status: 200, type: entityType })
    async upsert(@Body() dto: Create): Promise<Entity> {
      return this.service.upsert(dto);
    }

    @Put("/bulk")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiOperation({ summary: "Create or update multiple entities" })
    @ApiBody({ type: createDtoType, isArray: true })
    @ApiResponse({ status: 200, type: entityType, isArray: true })
    async upsertBulk(@Body() dto: Create[]): Promise<Entity[]> {
      return this.service.upsertBulk(dto);
    }

    @Patch("/")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiOperation({ summary: "Update multiple entities by filter" })
    @ApiBody({ type: updateDtoType })
    @ApiResponse({ status: 200, type: entityType, isArray: true })
    async updateIndexed(
      @Query("filter") filter: string,
      @Body() dto: Update
    ): Promise<Entity[]> {
      if (!filter) {
        throw new HttpException(400, "filter query is required", ErrorCodes.CLIENT_ERROR);
      }

      return this.service.updateIndexed(parseRawFilter(filter), dto);
    }

    @Patch("/:id")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiParam({ name: "id", type: String })
    @ApiOperation({ summary: "Update an entity" })
    @ApiBody({ type: updateDtoType })
    @ApiResponse({ status: 200, type: entityType })
    async update(
      @Param("id") id: string,
      @Body() dto: Update
    ): Promise<Entity> {
      const result = await this.service.update(id, dto);
      if (!result) {
        throw new HttpException(404, `Entity ${id} not found`);
      }
      return result;
    }

    @Delete("/")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiOperation({ summary: "Delete multiple entities by filter" })
    @HttpCode(204)
    @ApiResponse({ status: 204 })
    async deleteIndexed(@Query("filter") filter: string): Promise<void> {
      if (!filter) {
        throw new HttpException(400, "filter query is required", ErrorCodes.CLIENT_ERROR);
      }

      return this.service.deleteIndexed(parseRawFilter(filter));
    }

    @Delete("/:id")
    @UseGuards(AuthGuard)
    @ApiSecurity("api-key")
    @ApiParam({ name: "id", type: String })
    @ApiOperation({ summary: "Delete an entity by id" })
    @HttpCode(204)
    @ApiResponse({ status: 204 })
    async deleteById(@Param("id") id: string): Promise<void> {
      return this.service.deleteById(id);
    }
  }

  // Override metadata after class creation
  if (createDtoType) {
    Reflect.defineMetadata("design:paramtypes", [createDtoType], CrudControllerHost.prototype, "create");
    Reflect.defineMetadata("design:paramtypes", [createDtoType], CrudControllerHost.prototype, "createBulk");
    Reflect.defineMetadata("design:paramtypes", [createDtoType], CrudControllerHost.prototype, "upsert");
    Reflect.defineMetadata("design:paramtypes", [createDtoType], CrudControllerHost.prototype, "upsertBulk");
  }

  if (updateDtoType) {
    Reflect.defineMetadata("design:paramtypes", [String, updateDtoType], CrudControllerHost.prototype, "update");
    Reflect.defineMetadata("design:paramtypes", [String, updateDtoType], CrudControllerHost.prototype, "updateIndexed");
  }

  return CrudControllerHost;
}
