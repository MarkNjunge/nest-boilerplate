import { Module } from "@nestjs/common";
import { AppController } from "./app/app.controller";
import { AppService } from "./app/app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { config } from "./common/Config";
import { UsersModule } from "./users/users.module";
import * as path from "path";
import { UserEntity } from "./users/entitiy/User.entity";
import { AddressEntity } from "./users/entitiy/Address.entity";
import { ContactEntity } from "./users/entitiy/Contact.entity";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: config.db.url,
      entities: [UserEntity, AddressEntity, ContactEntity],
      migrations: [path.join(__dirname, "./db/migration/*{.ts,.js}")],
      migrationsRun: true,
      synchronize: false,
      extra: {
        ssl: config.db.ssl,
      },
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
