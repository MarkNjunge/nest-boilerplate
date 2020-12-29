import { ApiProperty } from "@nestjs/swagger";

export class ContactDto {
  @ApiProperty()
  email: string;
}
