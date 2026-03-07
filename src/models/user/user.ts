import { BaseEntity } from "@/models/_base/_base.entity";
import { Column, Entity, OneToOne } from "typeorm";
import { IsNotEmpty, IsOptional, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import {
  UserProfile,
  UserProfileCreateDto,
} from "@/models/user-profile/user-profile";
import { Type } from "class-transformer";

@Entity({ name: "users" })
export class User extends BaseEntity {
  @Column()
  @ApiProperty()
  username: string;

  @Column()
  @ApiProperty()
  email: string;

  @OneToOne(() => UserProfile, profile => profile.user, {
    cascade: true,
  })
  profile: UserProfile;

  idPrefix(): string {
    return "usr_";
  }
}

export class UserCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UserProfileCreateDto)
  profile: UserProfileCreateDto;
}

export class UserUpdateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  username?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  email?: string;
}
