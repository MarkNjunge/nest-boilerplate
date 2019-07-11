import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { AppService } from "./app.service";
import { UserDto } from "./dto/user.dto";
import { AuthGuard } from "../common/guards/auth.guard";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post("/")
  @UseGuards(AuthGuard)
  async createUser(@Body() dto: UserDto): Promise<UserDto> {
    return this.appService.createUser(dto);
  }
}
