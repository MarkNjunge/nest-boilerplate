import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "@/models/_base/_base.entity";
import { AddressTestEntity } from "@/db/crud/test-entities/address-test.entity";

@Entity({ name: "buildings" })
export class BuildingTestEntity extends BaseEntity {
  @Column()
  suite: string;

  @OneToOne(() => AddressTestEntity, address => address.building, { onDelete: "CASCADE" })
  @JoinColumn({ name: "address_id" })
  address?: AddressTestEntity;

  idPrefix(): string {
    return "bld_";
  }
}

export interface BuildingTestCreateDto {
  suite: string;
}
