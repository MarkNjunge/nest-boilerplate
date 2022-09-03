import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { dataSource } from "@/db/db-data-source";
import { Logger } from "@/logging/Logger";

const logger = new Logger("Database");

const options: TypeOrmModuleOptions = {
  ...dataSource.options,
  retryAttempts: 3,
  toRetry: err => {
    logger.error(err.message);
    return true;
  }
};


@Module({
  imports: [
    TypeOrmModule.forRoot(options),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
