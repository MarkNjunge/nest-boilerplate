import { Module } from "@nestjs/common";
import { DbService } from "./db.service";
import {
  USER_REPOSITORY,
  userRepository,
} from "@/db/repositories/user.repository";
import {
  ADDRESS_REPOSITORY,
  addressRepository,
} from "@/db/repositories/address.repository";
import {
  CONTACT_REPOSITORY,
  contactRepository,
} from "@/db/repositories/contact.repository";

@Module({
  providers: [
    DbService,
    { provide: USER_REPOSITORY, useValue: userRepository },
    { provide: ADDRESS_REPOSITORY, useValue: addressRepository },
    { provide: CONTACT_REPOSITORY, useValue: contactRepository },
  ],
  exports: [DbService, USER_REPOSITORY, ADDRESS_REPOSITORY, CONTACT_REPOSITORY],
})
export class DbModule {}
