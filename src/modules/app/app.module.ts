import { DynamicModule, Module, Provider } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "../users/users.module";
import { DbModule } from "@/modules/_db/db.module";
import { bool, config } from "@/config";
import { ThrottlerGuard, ThrottlerModule, seconds } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ClsModule } from "nestjs-cls";
import { appClsOptions } from "@/cls/app-cls";

const modules: DynamicModule[] = [];
const providers: Provider[] = [];

if (bool(config.rateLimit.enabled)) {
  modules.push(
    ThrottlerModule.forRoot([
      {
        ttl: seconds(config.rateLimit.timeWindow),
        limit: config.rateLimit.max,
      },
    ]),
  );
  providers.push({
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  });
}

@Module({
  imports: [
    ClsModule.forRoot(appClsOptions),
    ...modules,
    DbModule,
    UsersModule
  ],
  controllers: [AppController],
  providers: [...providers, AppService],
})
export class AppModule {}
