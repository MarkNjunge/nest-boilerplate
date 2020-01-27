import { Controller, Post, UseGuards, Body, Get } from "@nestjs/common";
import { UserDto } from "../users/dto/user.dto";
import { AuthGuard } from "../common/guards/auth.guard";
import {
  ApiResponse,
  ApiBadRequestResponse,
  ApiUseTags,
  ApiOperation,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/CreateUser.dto";
import { CreateAddressDto } from "./dto/CreateAddress.dto";
import { AddressDto } from "./dto/address.dto";

@Controller("users")
@ApiUseTags("Users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("/")
  @ApiOperation({ title: "Get all users" })
  @ApiResponse({ status: 200, type: UserDto, isArray: true })
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Post("/")
  @UseGuards(AuthGuard)
  @ApiOperation({ title: "Create a user" })
  @ApiResponse({
    status: 201,
    description: "The record has been successfully created.",
    type: UserDto,
  })
  @ApiBadRequestResponse({ description: "Missing or too many params" })
  async createUser(@Body() dto: CreateUserDto): Promise<UserDto> {
    return this.usersService.createUser(dto);
  }

  @Post("/addresses")
  @UseGuards(AuthGuard)
  @ApiOperation({ title: "Create an address" })
  @ApiResponse({
    status: 201,
    description: "The record has been successfully created.",
    type: AddressDto,
  })
  @ApiBadRequestResponse({ description: "Missing or too many params" })
  async createAddress(@Body() dto: CreateAddressDto): Promise<AddressDto> {
    return this.usersService.createAddress(dto);
  }
}
