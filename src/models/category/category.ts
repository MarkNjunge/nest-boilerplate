import { BaseEntity } from "../_base/_base.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

@Entity({ name: "categories" })
export class Category extends BaseEntity {
  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ name: "parent_id", type: "varchar", nullable: true })
  parentId?: string; // Define it so that it's returned

  @ManyToOne(() => Category, category => category.children, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "parent_id",
    foreignKeyConstraintName: "FK__category__parent_id",
  })
  parent?: Category;

  @OneToMany(() => Category, category => category.parent)
  children: Category[];

  idPrefix(): string {
    return "cat_";
  }
}

export class CategoryCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsOptional()
  parentId?: string;
}

export class CategoryUpdateDto {
  @ApiProperty()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsOptional()
  parentId?: string;
}
