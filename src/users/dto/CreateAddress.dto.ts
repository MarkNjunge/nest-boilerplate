import { IsNotEmpty } from "class-validator";
import { ApiModelProperty } from "@nestjs/swagger";

export class CreateAddressDto {
  @IsNotEmpty()
  @ApiModelProperty()
  userId: number;

  @IsNotEmpty()
  @ApiModelProperty()
  city: string;

  @IsNotEmpty()
  @ApiModelProperty()
  country: string;
}
