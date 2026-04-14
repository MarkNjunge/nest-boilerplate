import { BeforeInsert, Column, PrimaryColumn } from "typeorm";
import { genId } from "@/lib/crud/entity/id";

export abstract class BaseEntity {
  abstract idPrefix(): string;

  @PrimaryColumn({ type: "varchar" })
  id: string;

  @Column({ type: "timestamptz", name: "created_at", default: () => "now()", update: false })
  createdAt: Date;

  @Column({ type: "timestamptz", name: "updated_at", default: () => "now()" })
  updatedAt: Date;

  // Used only to set id/timestamps on cascade-inserted child entities.
  // CrudService sets these fields explicitly on root entities before calling save().
  @BeforeInsert()
  beforeInsert() {
    this.id = this.id || genId(this.idPrefix());
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    this.createdAt = this.createdAt || new Date();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    this.updatedAt = this.updatedAt || new Date();
  }
}
