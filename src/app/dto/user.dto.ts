import { IsNotEmpty, ValidateNested } from "class-validator";
import { ApiModelProperty } from "@nestjs/swagger";
import { AddressDto } from "./address.dto";
import { Type } from "class-transformer";

export class UserDto {
  @IsNotEmpty()
  @ApiModelProperty()
  username: string;

  @IsNotEmpty()
  @ApiModelProperty()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  address: AddressDto;
}
