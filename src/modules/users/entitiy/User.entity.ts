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
import { UpdateUserDto } from "../dto/UpdateUser.dto";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ name: "username" })
  username: string;

  @OneToMany(() => AddressEntity, address => address.user, {
    eager: true,
    cascade: true,
  })
  addresses: AddressEntity[];

  @OneToOne(() => ContactEntity, contact => contact.user, {
    eager: true,
    cascade: true,
  })
  contact: ContactEntity;

  static fromCreateDto(dto: CreateUserDto): UserEntity {
    const user = new UserEntity();
    user.username = dto.username;
    user.contact = ContactEntity.fromCreateDto(dto.contact);

    return user;
  }

  static fromUpdateDto(dto: UpdateUserDto): UserEntity {
    const user = new UserEntity();
    user.username = dto.username;
    user.contact = ContactEntity.fromUpdateDto(dto.contact);

    return user;
  }
}
