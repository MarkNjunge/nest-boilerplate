import { BaseEntity } from "@/models/_base/_base.entity";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import type { User } from "@/models/user/user";

@Entity({ name: "user_profiles" })
export class UserProfile extends BaseEntity {
  @Column()
  @ApiProperty()
  bio: string;

  @OneToOne("User", "profile", { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id", foreignKeyConstraintName: "FK__users__user_profiles" })
  user?: User;

  idPrefix(): string {
    return "usrp_";
  }
}

export class UserProfileCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  bio: string;
}

export class UserProfileUpdateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  bio?: string;
}
