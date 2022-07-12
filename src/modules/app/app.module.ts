import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { config } from "../../config";
import { UsersModule } from "../users/users.module";
import * as path from "path";
import { TlsOptions } from "tls";

let sslConfig: boolean | TlsOptions = config.db.ssl;
if (config.db.ssl) {
  sslConfig = {
    // This accepts a self signed certificate
    // See node-postgres docs for how to verify
    // https://node-postgres.com/features/ssl
    rejectUnauthorized: false,
  };
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // @ts-expect-error: types are not listed correctly
      type: "postgres",
      url: config.db.url,
      entities: [path.join(__dirname, "../../models/**/*.entity{.ts,.js}")],
      migrations: [path.join(__dirname, "../../db/migration/*{.ts,.js}")],
      migrationsRun: true,
      synchronize: false,
      sslConfig,
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
