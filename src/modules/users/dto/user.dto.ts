import { ApiProperty } from "@nestjs/swagger";
import { AddressDto } from "./address.dto";
import { ContactDto } from "./contact.dto";
import { Type } from "class-transformer";

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
