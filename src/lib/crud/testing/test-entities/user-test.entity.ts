import { Column, Entity, OneToOne } from "typeorm";
import { BaseEntity } from "@/lib/crud/entity/base.entity";
import { UserProfileTestEntity, UserProfileTestCreateDto } from "@/lib/crud/testing/test-entities/user-profile-test.entity";
import {
  AddressTestCreateDto,
  AddressTestEntity
} from "@/lib/crud/testing/test-entities/address-test.entity";

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
