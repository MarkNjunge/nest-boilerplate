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
  })
  @ApiBadRequestResponse({ description: "Missing or too many params" })
  async createUser(@Body() dto: UserDto): Promise<UserDto> {
    return this.usersService.createUser(dto);
  }
}
