import { Injectable } from "@nestjs/common";
import Knex, { Knex as KType } from "knex";
import { Model } from "objection";
import knexConfig from "../../db/knexfile";
import { config } from "@/config";
import { Logger } from "@/logging/Logger";
import { BaseRepository } from "@/modules/_db/base.repository";
import { UserModel } from "@/models/user/user.model";
import { CreateUserDto, UpdateUserDto } from "@/models/user";
import { AddressModel } from "@/models/address/address.model";
import { CreateAddressDto } from "@/models/address";
import { ContactModel } from "@/models/contact/contact.model";
import { CreateContactDto, UpdateContactDto } from "@/models/contact";



@Injectable()
export class DbService {
  knex: KType;

  private logger = new Logger("DbService");

  user: BaseRepository<UserModel, CreateUserDto, UpdateUserDto>;
  address: BaseRepository<AddressModel, CreateAddressDto, any>;
  contact: BaseRepository<ContactModel, CreateContactDto, UpdateContactDto>;

  constructor() {
    this.knex = Knex(knexConfig);
    Model.knex(this.knex);

    if (config.db.logQueries) {
      this.knex.on("query", queryData => {
        this.logger.debug(this.fillBindings(queryData.sql, queryData.bindings));
      });
    }

    this.user = new BaseRepository<UserModel, CreateUserDto, UpdateUserDto>(UserModel);
    this.address = new BaseRepository<AddressModel, CreateAddressDto, any>(AddressModel);
    this.contact = new BaseRepository<ContactModel, CreateContactDto, UpdateContactDto>(ContactModel);
  }

  async testConnection() {
    await this.knex.raw("SELECT 1");
  }

  async migrateLatest() {
    await this.knex.migrate.latest();
  }

  private fillBindings(sql: string, bindings: any[] = []): string {
    for (let i = 0; i < bindings.length; i++) {
      let binding = bindings[i];
      if (typeof binding === "string") {
        binding = `'${binding}'`;
      }
      sql = sql.replace(`$${i + 1}`, binding);
    }

    return sql;
  }
}
