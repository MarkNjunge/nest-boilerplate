import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { IsNotEmpty } from "class-validator";

export class ContactDto {
  @ApiProperty()
  @Exclude()
  id: number;

  @ApiProperty()
  email: string;
}

export class CreateContactDto {
  @ApiProperty()
  @IsNotEmpty()
  email: string;
}

export class UpdateContactDto {
  @ApiProperty()
  @IsNotEmpty()
  email: string;
}
