import { BaseModel } from "@/models/_base.model";

export class ContactModel extends BaseModel {
  email: string;
  userId: number;

  static get tableName() {
    return "contacts";
  }
}
