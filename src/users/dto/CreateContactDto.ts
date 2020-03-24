import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateContactDto {
  @ApiProperty()
  @IsNotEmpty()
  email: string;
}
