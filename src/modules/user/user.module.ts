import { Module } from "@nestjs/common";
import { DbModule } from "@/modules/_db/db.module";
import { UserService } from "@/modules/user/user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@/models/user/user";
import { UserController } from "@/modules/user/user.controller";

@Module({
  imports: [DbModule, TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {
}
