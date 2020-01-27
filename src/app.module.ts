import { Module } from "@nestjs/common";
import { AppController } from "./app/app.controller";
import { AppService } from "./app/app.service";
import { UsersController } from "./users/users.controller";
import { UsersService } from "./users/users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { config } from "./common/Config";
import { UserEntity } from "./users/entitiy/User.entity";
import { AddressEntity } from "./users/entitiy/Address.entity";
import * as path from "path";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: config.db.url,
      entities: [path.join(__dirname, "./**/*.entity{.ts,.js}")],
      migrations: [path.join(__dirname, "./migration/*{.ts,.js}")],
      migrationsRun: true,
      synchronize: false,
      extra: {
        ssl: config.db.ssl,
      },
    }),
    TypeOrmModule.forFeature([UserEntity, AddressEntity]),
  ],
  controllers: [AppController, UsersController],
  providers: [AppService, UsersService],
})
export class AppModule {}
