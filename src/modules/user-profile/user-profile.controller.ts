import { Controller, UsePipes } from "@nestjs/common";
import { CrudController } from "@/lib/crud";
import {
  UserProfile,
  UserProfileCreateDto,
  UserProfileUpdateDto
} from "@/models/user-profile/user-profile";
import { UserProfileService } from "@/modules/user-profile/user-profile.service";
import { ValidationPipe } from "@/pipes/validation.pipe";

@Controller("user-profiles")
@UsePipes(ValidationPipe)
export class UserProfileController extends CrudController(
  UserProfile,
  UserProfileCreateDto,
  UserProfileUpdateDto,
  { auth: { mode: "ADMIN" } }
) {
  constructor(
    protected readonly userProfileService: UserProfileService
  ) {
    super();
  }

  get service() {
    return this.userProfileService;
  }
}
