import { BaseModel } from "@/models/_base.model";

export class AddressModel extends BaseModel {
  city: string;
  country: string;

  static get tableName() {
    return "addresses";
  }
}
