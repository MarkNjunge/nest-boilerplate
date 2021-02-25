import { Module } from "@nestjs/common";
import { AppController } from "./modules/app/app.controller";
import { AppService } from "./modules/app/app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { config } from "./common/Config";
import { UsersModule } from "./modules/users/users.module";
import * as path from "path";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: config.db.url,
      entities: [path.join(__dirname, "./db/entity/*.entity{.ts,.js}")],
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
