import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  Param,
  Delete,
  Put,
} from "@nestjs/common";
import { AuthGuard } from "../../guards/auth.guard";
import {
  ApiResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiTags,
  ApiSecurity, ApiBody,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UserDto, CreateUserDto, UpdateUserDto } from "../../models/user";
import { AddressDto, CreateAddressDto } from "../../models/address";
import { ApiResponseDto } from "../shared/dto/ApiResponse.dto";
import { ArrayValidationPipe } from "../../pipes/array-validation.pipe";
import { HttpException } from "../../utils/HttpException";
import { ErrorCodes } from "../../utils/error-codes";
import { IReqCtx, ReqCtx } from "../../decorators/request-context.decorator";

@Controller("users")
@ApiTags("Users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("/:id")
  @ApiOperation({ summary: "Get a user" })
  @ApiResponse({ status: 200, type: UserDto })
  async get(@ReqCtx() ctx: IReqCtx, @Param("id") id: number): Promise<UserDto> {
    const user = await this.usersService.get(ctx, id);
    if (!user) {
      throw new HttpException(404, `The user ${id} does not exist`, ErrorCodes.INVALID_USER);
    }

    return user;
  }

  @Get("/")
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, type: UserDto, isArray: true })
  async list(@ReqCtx() ctx: IReqCtx): Promise<UserDto[]> {
    return this.usersService.list(ctx);
  }

  @Post("/")
  @UseGuards(AuthGuard)
  @ApiSecurity("api-key")
  @ApiOperation({ summary: "Create a user" })
  @ApiResponse({
    status: 201,
    description: "The user has been created successfully.",
    type: UserDto,
  })
  @ApiBadRequestResponse({ description: "Missing or too many params" })
  async create(@ReqCtx() ctx: IReqCtx, @Body() dto: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(ctx, dto);
  }

  @Post("/_bulk")
  @UseGuards(AuthGuard)
  @ApiSecurity("api-key")
  @ApiOperation({ summary: "Create a user" })
  @ApiBody({ type: CreateUserDto, isArray: true })
  @ApiResponse({
    status: 201,
    description: "The user has been created successfully.",
    isArray: true,
    type: UserDto,
  })
  @ApiBadRequestResponse({ description: "Missing or too many params" })
  async createBulk(
    @ReqCtx() ctx: IReqCtx,
    @Body(new ArrayValidationPipe(CreateUserDto)) dto: CreateUserDto[],
  ): Promise<UserDto[]> {
    return this.usersService.createBulk(ctx, dto);
  }

  @Put(":id")
  @UseGuards(AuthGuard)
  @ApiSecurity("api-key")
  @ApiOperation({ summary: "Update a user" })
  @ApiResponse({
    status: 200,
    description: "The user has been updated",
    type: ApiResponseDto,
  })
  async update(
    @ReqCtx() ctx: IReqCtx,
    @Param("id") id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserDto> {
    return this.usersService.update(ctx, id, dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  @ApiSecurity("api-key")
  @ApiOperation({ summary: "Delete a user" })
  @ApiResponse({
    status: 200,
    description: "The user has been deleted",
    type: ApiResponseDto,
  })
  async delete(@ReqCtx() ctx: IReqCtx, @Param("id") id: number): Promise<ApiResponseDto> {
    await this.usersService.delete(ctx, id);

    return { message: "User deleted" };
  }

  @Post(":id/addresses")
  @UseGuards(AuthGuard)
  @ApiSecurity("api-key")
  @ApiOperation({ summary: "Create an address" })
  @ApiResponse({
    status: 201,
    description: "The address has been created successfully.",
    type: AddressDto,
  })
  @ApiBadRequestResponse({ description: "Bad Request" })
  async createAddress(
    @ReqCtx() ctx: IReqCtx,
    @Param("id") id: number,
    @Body() dto: CreateAddressDto,
  ): Promise<AddressDto> {
    return this.usersService.createAddress(ctx, id, dto);
  }
}
