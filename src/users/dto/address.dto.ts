import { ApiProperty } from "@nestjs/swagger";

export class AddressDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  city: string;

  @ApiProperty()
  country: string;
}
