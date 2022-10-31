import { ApiProperty } from "@nestjs/swagger";
import { AddressDto } from "../address";
import { Type } from "class-transformer";
import { IsNotEmpty, ValidateNested } from "class-validator";
import { ContactDto, CreateContactDto, UpdateContactDto } from "../contact";

export class UserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  contact: ContactDto;

  @ApiProperty({ type: AddressDto, isArray: true })
  @Type(() => AddressDto)
  addresses: AddressDto[];
}

export class CreateUserDto {
  @IsNotEmpty()
  @ApiProperty()
  username: string;

  @IsNotEmpty()
  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  contact: CreateContactDto;
}

export class UpdateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  contact: UpdateContactDto;
}
