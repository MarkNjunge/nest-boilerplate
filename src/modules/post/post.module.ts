import { Module } from "@nestjs/common";
import { PostController } from "@/modules/post/post.controller";
import { PostService } from "@/modules/post/post.service";
import { DbModule } from "@/modules/_db/db.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Post } from "@/models/post/post";

@Module({
  imports: [DbModule, TypeOrmModule.forFeature([Post])],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
