import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { UserEntity } from "./User.entity";
import { CreateAddressDto } from "../dto/CreateAddress.dto";

@Entity({ name: "addresses" })
export class AddressEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ name: "city" })
  city: string;

  @Column({ name: "country" })
  country: string;

  @ManyToOne(() => UserEntity, user => user.addresses, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  static fromCreateDto(user: UserEntity, dto: CreateAddressDto): AddressEntity {
    user = user;
    const address = new AddressEntity();
    address.city = dto.city;
    address.country = dto.country;
    address.user = user;

    return address;
  }
}
