import { BaseEntity } from "@/lib/crud";
import { Column, JoinColumn, ManyToOne } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "@/models/user/user";

export abstract class UserScopedEntity extends BaseEntity {
  @ApiProperty()
  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;
}
