import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class UpdateContactDto {
  @ApiProperty()
  @IsNotEmpty()
  email: string;
}
