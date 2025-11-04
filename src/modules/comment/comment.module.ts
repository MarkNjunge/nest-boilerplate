import { Module } from "@nestjs/common";
import { CommentController } from "@/modules/comment/comment.controller";
import { CommentService } from "@/modules/comment/comment.service";
import { DbModule } from "@/modules/_db/db.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Comment } from "@/models/comment/comment";

@Module({
  imports: [DbModule, TypeOrmModule.forFeature([Comment])],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
