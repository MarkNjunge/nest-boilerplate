import { BaseEntity } from "@/lib/crud";
import { Column, JoinColumn, ManyToOne } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

export abstract class UserScopedEntity<TUser = any> extends BaseEntity {
  /** Return the project's User entity class (for runtime access). */
  abstract getUserType(): new (...args: any[]) => TUser;

  /** Set by subclasses in a static block to enable the {@link user} relation. */
  static _userType: new (...args: any[]) => any;

  @ApiProperty()
  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => UserScopedEntity._userType, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: TUser;
}
