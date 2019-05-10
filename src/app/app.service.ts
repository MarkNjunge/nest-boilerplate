import { Injectable } from "@nestjs/common";
import { UserDto } from "./dto/user.dto";

@Injectable()
export class AppService {
  getHello(): string {
    return "Hello World!";
  }

  async user(userDto: UserDto): Promise<UserDto> {
    return userDto;
  }
}
