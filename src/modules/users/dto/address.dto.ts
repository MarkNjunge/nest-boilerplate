import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class AddressDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  city: string;

  @ApiProperty()
  @Expose()
  country: string;
}
