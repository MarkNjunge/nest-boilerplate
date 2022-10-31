import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { IsEmpty, IsNotEmpty } from "class-validator";

export class AddressDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  city: string;

  @ApiProperty()
  country: string;
}

export class CreateAddressDto {
  @IsNotEmpty()
  @ApiProperty()
  city: string;

  @IsNotEmpty()
  @ApiProperty()
  country: string;

  @IsEmpty()
  @ApiHideProperty()
  userId?: number;
}
