import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { AddressEntity } from "./Address.entity";

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
}
