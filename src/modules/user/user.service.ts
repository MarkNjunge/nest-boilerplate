import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User, UserCreateDto, UserUpdateDto } from "@/models/user/user";
import { CrudService } from "@/lib/crud";

@Injectable()
export class UserService extends CrudService<User, UserCreateDto, UserUpdateDto> {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {
    super("User", usersRepository);
  }
}
