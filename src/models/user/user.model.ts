import { BaseModel } from "@/models/_base.model";
import type { ContactDto } from "@/models/contact";
import type { AddressDto } from "@/models/address";
import { Model } from "objection";

export class UserModel extends BaseModel {
  username: string;
  contact: ContactDto;
  addresses: AddressDto[];

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  static get tableName() {
    return "users";
  }

  static get relationMappings() {
    return {
      contact: {
        modelClass: "contact/contact.model",
        relation: Model.HasOneRelation,
        // Selecting some columns will mess with withGraphJoined
        // filter: query => query.select("email"),
        join: {
          from: "users.id",
          to: "contacts.user_id",
        },
      },
      addresses: {
        modelClass: "address/address.model",
        relation: Model.HasManyRelation,
        join: {
          from: "users.id",
          to: "addresses.user_id",
        },
      },
    };
  }
}
