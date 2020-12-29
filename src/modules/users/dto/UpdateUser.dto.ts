import { ApiProperty } from "@nestjs/swagger";
import { UpdateContactDto } from "./UpdateContact.dto";
import { IsNotEmpty } from "class-validator";

export class UpdateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  contact: UpdateContactDto;
}
