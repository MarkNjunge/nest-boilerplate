import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../../db/entity/User.entity";
import { AddressEntity } from "../../db/entity/Address.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AddressEntity])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
