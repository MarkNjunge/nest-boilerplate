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
import { UserDto } from "./dto/user.dto";
import { AuthGuard } from "../../guards/auth.guard";
import {
  ApiResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiTags,
  ApiSecurity, ApiBody,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/CreateUser.dto";
import { CreateAddressDto } from "./dto/CreateAddress.dto";
import { AddressDto } from "./dto/address.dto";
import { ApiResponseDto } from "../shared/dto/ApiResponse.dto";
import { UpdateUserDto } from "./dto/UpdateUser.dto";
import { ArrayValidationPipe } from "../../pipes/array-validation.pipe";

@Controller("users")
@ApiTags("Users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("/")
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, type: UserDto, isArray: true })
  async getAllUsers(): Promise<UserDto[]> {
    return this.usersService.getAllUsers();
  }

  @Post("/")
  @UseGuards(AuthGuard)
  @ApiSecurity("x-api-key")
  @ApiOperation({ summary: "Create a user" })
  @ApiResponse({
    status: 201,
    description: "The user has been created successfully.",
    type: UserDto,
  })
  @ApiBadRequestResponse({ description: "Missing or too many params" })
  async createUser(@Body() dto: CreateUserDto): Promise<UserDto> {
    return this.usersService.createUser(dto);
  }

  @Post("/_bulk")
  @UseGuards(AuthGuard)
  @ApiSecurity("x-api-key")
  @ApiOperation({ summary: "Create a user" })
  @ApiBody({ type: CreateUserDto, isArray: true })
  @ApiResponse({
    status: 201,
    description: "The user has been created successfully.",
    isArray: true,
    type: UserDto,
  })
  @ApiBadRequestResponse({ description: "Missing or too many params" })
  async createUsersBulk(
    @Body(new ArrayValidationPipe(CreateUserDto)) dto: CreateUserDto[],
  ): Promise<UserDto[]> {
    return this.usersService.createUsersBulk(dto);
  }

  @Post(":id/addresses")
  @UseGuards(AuthGuard)
  @ApiSecurity("x-api-key")
  @ApiOperation({ summary: "Create an address" })
  @ApiResponse({
    status: 201,
    description: "The address has been created successfully.",
    type: AddressDto,
  })
  @ApiBadRequestResponse({ description: "Bad Request" })
  async createAddress(
    @Param("id") id: number,
    @Body() dto: CreateAddressDto,
  ): Promise<AddressDto> {
    return this.usersService.createAddress(id, dto);
  }

  @Put(":id")
  @UseGuards(AuthGuard)
  @ApiSecurity("x-api-key")
  @ApiOperation({ summary: "Update a user" })
  @ApiResponse({
    status: 200,
    description: "The user has been updated",
    type: ApiResponseDto,
  })
  async updateUser(
    @Param("id") id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<ApiResponseDto> {
    await this.usersService.updateUser(id, dto);

    return { message: "User updated" };
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  @ApiSecurity("x-api-key")
  @ApiOperation({ summary: "Delete a user" })
  @ApiResponse({
    status: 200,
    description: "The user has been deleted",
    type: ApiResponseDto,
  })
  async deleteUser(@Param("id") id: number): Promise<ApiResponseDto> {
    await this.usersService.deleteUser(id);

    return { message: "User deleted" };
  }
}
