import { BeforeInsert, BeforeUpdate, Column, PrimaryColumn } from "typeorm";
import { genId } from "@/utils/id";
import { config } from "@/config";

const DATE_TYPE = process.env.NODE_ENV === "test" && config.test.db === "sqlite" ? "datetime" : "timestamptz";

export abstract class BaseEntity {
  abstract idPrefix(): string;

  @PrimaryColumn({ type: "varchar" })
  id: string;

  @Column({ type: DATE_TYPE, name: "created_at", default: () => "now()" })
  createdAt: Date;

  @Column({ type: DATE_TYPE, name: "updated_at", default: () => "now()" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsert() {
    this.id = this.id || genId(this.idPrefix());
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    this.createdAt = this.createdAt || new Date();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    this.updatedAt = this.updatedAt || new Date();
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.updatedAt = new Date();
  }
}
