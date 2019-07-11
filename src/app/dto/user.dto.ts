import { IsNotEmpty } from "class-validator";
import { ApiModelProperty } from "@nestjs/swagger";

export class UserDto {
  @IsNotEmpty()
  @ApiModelProperty()
  username: string;
}
