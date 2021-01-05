import { ApiProperty } from "@nestjs/swagger";
import { AddressDto } from "./address.dto";
import { ContactDto } from "./contact.dto";
import { Expose } from "class-transformer";

export class UserDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  username: string;

  @ApiProperty()
  @Expose()
  contact: ContactDto;

  @ApiProperty({ type: AddressDto, isArray: true })
  @Expose()
  addresses: AddressDto[];
}
