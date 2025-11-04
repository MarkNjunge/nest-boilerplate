import { BaseEntity } from "../_base/_base.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";
import type { User } from "../user/user";
import type { Post } from "../post/post";

@Entity({ name: "comments" })
export class Comment extends BaseEntity {
  @ApiProperty()
  @Column({ type: "text" })
  content: string;

  @ApiProperty()
  @Column({ name: "user_id" })
  userId: string;

  @ApiProperty()
  @Column({ name: "post_id" })
  postId: string;

  @ManyToOne("User", { onDelete: "CASCADE" })
  @JoinColumn({
    name: "user_id",
    foreignKeyConstraintName: "FK__comment__user_id"
  })
  user?: User;

  @ManyToOne("Post", "comments", { onDelete: "CASCADE" })
  @JoinColumn({
    name: "post_id",
    foreignKeyConstraintName: "FK__comment__post_id"
  })
  post?: Post;

  idPrefix(): string {
    return "com_";
  }
}

export class CommentCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsNotEmpty()
  postId: string;
}

export class CommentUpdateDto {
  @ApiProperty()
  @IsOptional()
  content?: string;
}
