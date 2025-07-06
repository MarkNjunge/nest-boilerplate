import { BaseModel } from "@/models/_base.model";

export class AddressModel extends BaseModel {
  city: string;
  country: string;

  static readonly tableName = "addresses";
}
