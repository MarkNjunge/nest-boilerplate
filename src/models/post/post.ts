import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";
import { Category } from "../category/category";
import { Comment } from "../comment/comment";
import { UserScopedEntity } from "@/lib/crud/entity/user-scoped.entity";

@Entity({ name: "posts" })
export class Post extends UserScopedEntity {
  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty()
  @Column({ type: "text" })
  content: string;

  @ApiProperty()
  @Column({ name: "category_id", nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, {
    onDelete: "SET NULL",
  })
  @JoinColumn({
    name: "category_id",
    foreignKeyConstraintName: "FK__post__category_id",
  })
  category?: Category;

  @OneToMany(() => Comment, comment => comment.post)
  comments?: Comment[];

  idPrefix(): string {
    return "post_";
  }
}

export class PostCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  categoryId?: string;
}

export class PostUpdateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  categoryId?: string;
}
