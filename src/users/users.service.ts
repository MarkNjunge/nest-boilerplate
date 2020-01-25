import { Injectable } from "@nestjs/common";
import { UserDto } from "./dto/user.dto";
import { CustomLogger } from "../common/CustomLogger";

@Injectable()
export class UsersService {
  private logger = new CustomLogger("UsersService");

  private users: UserDto[] = [];

  async getAllUsers(): Promise<UserDto[]> {
    return this.users;
  }

  async createUser(userDto: UserDto): Promise<UserDto> {
    this.logger.debug(JSON.stringify(userDto));

    this.users.push(userDto);

    return userDto;
  }
}
