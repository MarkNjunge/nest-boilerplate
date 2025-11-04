import { Module } from "@nestjs/common";
import { DbModule } from "@/modules/_db/db.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserProfileController } from "@/modules/user-profile/user-profile.controller";
import { UserProfileService } from "@/modules/user-profile/user-profile.service";
import { UserProfile } from "@/models/user-profile/user-profile";

@Module({
  imports: [DbModule, TypeOrmModule.forFeature([UserProfile])],
  controllers: [UserProfileController],
  providers: [UserProfileService]
})
export class UserProfileModule {
}
