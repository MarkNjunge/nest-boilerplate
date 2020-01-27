import { ApiModelProperty } from "@nestjs/swagger";

export class AddressDto {
  @ApiModelProperty()
  id: number;

  @ApiModelProperty()
  city: string;

  @ApiModelProperty()
  country: string;
}
