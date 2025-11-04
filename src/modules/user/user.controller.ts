import { Controller } from "@nestjs/common";
import { CrudController } from "@/db/crud/crud.controller";
import { User, UserCreateDto, UserUpdateDto } from "@/models/user/user";
import { UserService } from "@/modules/user/user.service";

@Controller("users")
export class UserController extends CrudController(User, UserCreateDto, UserUpdateDto)<UserCreateDto, UserUpdateDto> {
  constructor(
    protected readonly userService: UserService
  ) {
    super(userService);
  }

}
