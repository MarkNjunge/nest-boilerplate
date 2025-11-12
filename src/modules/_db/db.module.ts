import { Module } from "@nestjs/common";
import { DbService } from "./db.service";
import { dbOptions } from "@/modules/_db/data-source";
import { DbLogger } from "@/logging/db-logger";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@/models/user/user";
import { UserProfile } from "@/models/user-profile/user-profile";
import { Category } from "@/models/category/category";
import { Post } from "@/models/post/post";
import { Comment } from "@/models/comment/comment";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...(dbOptions as any),
      logging: "all",
      logger: new DbLogger(true),
    }),
  ],
  providers: [DbService],
  exports: [
    TypeOrmModule.forRoot(),
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      Category,
      Post,
      Comment
    ]),
    DbService,
  ],
})
export class DbModule {}
