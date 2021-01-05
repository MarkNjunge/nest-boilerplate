import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ContactDto {
  @ApiProperty()
  @Expose()
  email: string;
}
