/* eslint-disable max-len */
import { BaseRepository } from "@/db/base.repository";
import { AddressModel } from "@/models/address/address.model";
import { CreateAddressDto } from "@/models/address";

export type AddressRepository = BaseRepository<AddressModel, CreateAddressDto, any>;
export const addressRepository = new BaseRepository<AddressModel, CreateAddressDto, any>(AddressModel);
export const ADDRESS_REPOSITORY = "ADDRESS_REPOSITORY";
