import { DynamicModule, Module, Provider } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { bool, config } from "@/config";
import { ThrottlerGuard, ThrottlerModule, seconds } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ClsModule } from "nestjs-cls";
import { appClsOptions } from "@/cls/app-cls";
import { DbModule } from "@/modules/_db/db.module";
import { UserModule } from "@/modules/user/user.module";
import { UserProfileModule } from "@/modules/user-profile/user-profile.module";
import { CategoryModule } from "@/modules/category/category.module";
import { PostModule } from "@/modules/post/post.module";
import { CommentModule } from "@/modules/comment/comment.module";

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
    UserModule,
    UserProfileModule,
    CategoryModule,
    PostModule,
    CommentModule
  ],
  controllers: [AppController],
  providers: [...providers, AppService],
})
export class AppModule {}
