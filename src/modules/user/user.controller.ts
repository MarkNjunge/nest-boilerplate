import { Controller } from "@nestjs/common";
import { CrudController } from "@/lib/crud";
import { User, UserCreateDto, UserUpdateDto } from "@/models/user/user";
import { UserService } from "@/modules/user/user.service";

@Controller("users")
export class UserController extends CrudController(
  User,
  UserCreateDto,
  UserUpdateDto,
  { auth: { mode: "ADMIN" } }
) {
  constructor(
    protected readonly userService: UserService
  ) {
    super();
  }

  get service() {
    return this.userService;
  }

}
