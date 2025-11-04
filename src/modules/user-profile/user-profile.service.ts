import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CrudService } from "@/db/crud/crud.service";
import {
  UserProfile,
  UserProfileCreateDto,
  UserProfileUpdateDto
} from "@/models/user-profile/user-profile";

@Injectable()
export class UserProfileService extends CrudService<UserProfile, UserProfileCreateDto, UserProfileUpdateDto> {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfilesRepository: Repository<UserProfile>
  ) {
    super("UserProfile", userProfilesRepository);
  }
}
