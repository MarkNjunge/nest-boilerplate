import { Column, Entity } from "typeorm";
import { BaseEntity } from "@/lib/crud/entity/base.entity";

@Entity({ name: "posts_test" })
export class PostTestEntity extends BaseEntity {
  @Column()
  title: string;

  @Column({ name: "user_id" })
  userId: string;

  idPrefix(): string {
    return "pst_";
  }
}

export interface PostTestCreateDto {
  title: string;
}
