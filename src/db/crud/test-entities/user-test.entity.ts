import { Column, DeepPartial, Entity, OneToOne } from "typeorm";
import { BaseEntity } from "@/models/_base/_base.entity";
import { UserProfileTestEntity, UserProfileTestCreateDto } from "@/db/crud/test-entities/user-profile-test.entity";
import {
  AddressTestCreateDto,
  AddressTestEntity
} from "@/db/crud/test-entities/address-test.entity";

@Entity({ name: "users" })
export class UserTestEntity extends BaseEntity {
  @Column()
  username: string;

  @Column()
  email: string;

  @OneToOne(() => UserProfileTestEntity, profile => profile.user, { eager: true, cascade: true })
  profile: UserProfileTestEntity;

  @OneToOne(() => AddressTestEntity, address => address.user, { cascade: true })
  address: AddressTestEntity;

  idPrefix(): string {
    return "usr_";
  }
}

export interface UserTestCreateDto {
  id?: string;
  username: string;
  email: string;
  profile?: UserProfileTestCreateDto;
  address?: AddressTestCreateDto;
}
