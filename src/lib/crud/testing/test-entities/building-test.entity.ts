import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "@/lib/crud/entity/base.entity";
import { AddressTestEntity } from "@/lib/crud/testing/test-entities/address-test.entity";

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
