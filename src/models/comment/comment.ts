import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";
import { User } from "../user/user";
import type { Post } from "../post/post";
import { UserScopedEntity } from "@/lib/crud/entity/user-scoped.entity";

@Entity({ name: "comments" })
export class Comment extends UserScopedEntity<User> {
  static {
    UserScopedEntity._userType = User;
  }

  getUserType() {
    return User;
  }

  @ApiProperty()
  @Column({ type: "text" })
  content: string;

  @ApiProperty()
  @Column({ name: "post_id" })
  postId: string;

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
  postId: string;
}

export class CommentUpdateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  content?: string;
}
