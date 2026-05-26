import { BeforeInsert, Column, PrimaryColumn } from "typeorm";
import { genId } from "@/lib/crud/entity/id";
import { ApiProperty } from "@nestjs/swagger";

export abstract class BaseEntity {
  abstract idPrefix(): string;

  @ApiProperty()
  @PrimaryColumn({ type: "varchar" })
  id: string;

  @ApiProperty()
  @Column({ type: "timestamptz", name: "created_at", default: () => "now()", update: false })
  createdAt: Date;

  @ApiProperty()
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
