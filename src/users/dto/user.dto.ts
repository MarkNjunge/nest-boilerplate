import { ApiModelProperty } from "@nestjs/swagger";
import { AddressDto } from "./address.dto";

export class UserDto {
  @ApiModelProperty()
  id: number;

  @ApiModelProperty()
  username: string;

  @ApiModelProperty({ type: AddressDto, isArray: true })
  addresses: AddressDto[];
}
