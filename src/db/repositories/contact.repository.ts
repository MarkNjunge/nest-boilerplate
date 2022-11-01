/* eslint-disable max-len */
import { BaseRepository } from "@/db/base.repository";
import { ContactModel } from "@/models/contact/contact.model";
import { CreateContactDto, UpdateContactDto } from "@/models/contact";

export type ContactRepository = BaseRepository<ContactModel, CreateContactDto, UpdateContactDto>;
export const contactRepository = new BaseRepository<ContactModel, CreateContactDto, UpdateContactDto>(ContactModel);
export const CONTACT_REPOSITORY = "CONTACT_REPOSITORY";
