import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "@/models/_base/_base.entity";
import { BuildingTestCreateDto, BuildingTestEntity } from "./building-test.entity";
import { UserTestEntity } from "@/db/crud/test-entities/user-test.entity";

@Entity({ name: "addresses" })
export class AddressTestEntity extends BaseEntity {
  @OneToOne(() => BuildingTestEntity, building => building.address, { cascade: true })
  building: BuildingTestEntity;

  @OneToOne(() => UserTestEntity, user => user.profile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: UserTestEntity;

  idPrefix(): string {
    return "adr_";
  }
}

export interface AddressTestCreateDto {
  building: BuildingTestCreateDto;
}
