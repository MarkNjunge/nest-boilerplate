import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { AddressEntity } from "./Address.entity";
import { ContactEntity } from "./Contact.entity";
import { CreateUserDto } from "../dto/CreateUser.dto";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ name: "username" })
  username: string;

  @OneToMany(
    type => AddressEntity,
    address => address.user,
    {
      eager: true,
      cascade: true,
    },
  )
  addresses: AddressEntity[];

  @OneToOne(
    type => ContactEntity,
    contact => contact.user,
    {
      eager: true,
      cascade: true,
    },
  )
  contact: ContactEntity;

  static fromCreateDto(dto: CreateUserDto): UserEntity {
    const user = new UserEntity();
    user.username = dto.username;
    user.contact = ContactEntity.fromCreateDto(dto.contact);

    return user;
  }
}
