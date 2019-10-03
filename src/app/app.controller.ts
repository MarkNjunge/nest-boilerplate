import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AppService } from "./app.service";
import { UserDto } from "./dto/user.dto";
import { AuthGuard } from "../common/guards/auth.guard";
import { ApiResponse, ApiBadRequestResponse } from "@nestjs/swagger";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post("/")
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 201,
    description: "The record has been successfully created.",
  })
  @ApiBadRequestResponse({ description: "Missing or too many params" })
  async createUser(@Body() dto: UserDto): Promise<UserDto> {
    return this.appService.createUser(dto);
  }
}
