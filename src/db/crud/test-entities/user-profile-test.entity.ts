import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "@/models/_base/_base.entity";
import { UserTestEntity } from "@/db/crud/test-entities/user-test.entity";

@Entity({ name: "user_profiles" })
export class UserProfileTestEntity extends BaseEntity {
  @Column({ nullable: true })
  bio?: string;

  @OneToOne(() => UserTestEntity, user => user.profile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: UserTestEntity;

  idPrefix(): string {
    return "usrp_";
  }
}

export class UserProfileTestCreateDto {
  bio?: string;
}
