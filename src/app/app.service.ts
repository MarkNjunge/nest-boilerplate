import { Injectable } from "@nestjs/common";
import { UserDto } from "./dto/user.dto";
import { CustomLogger } from "../common/CustomLogger";

@Injectable()
export class AppService {
  logger: CustomLogger = new CustomLogger("AppService");

  getHello(): string {
    this.logger.debug("Hello!", "AppService.getHello");
    return "Hello World!";
  }

  async createUser(userDto: UserDto): Promise<UserDto> {
    this.logger.debug(JSON.stringify(userDto));
    return userDto;
  }
}
