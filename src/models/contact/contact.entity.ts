import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { UserEntity } from "../user";
import { CreateContactDto, UpdateContactDto } from "../contact";

@Entity({ name: "contacts" })
export class ContactEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ name: "email" })
  email: string;

  @OneToOne(() => UserEntity, user => user.contact, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  static fromCreateDto(dto: CreateContactDto): ContactEntity {
    const contact = new ContactEntity();
    contact.email = dto.email;

    return contact;
  }

  static fromUpdateDto(dto: UpdateContactDto): ContactEntity {
    const contact = new ContactEntity();
    contact.email = dto.email;

    return contact;
  }
}
