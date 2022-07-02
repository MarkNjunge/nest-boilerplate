import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";

export class ContactDto {
  @ApiProperty()
  @Exclude()
  id: number;

  @ApiProperty()
  email: string;
}
