import { IsNotEmpty, ValidateNested } from "class-validator";
import { ApiModelProperty } from "@nestjs/swagger";
import { CountryDto } from "./country.dto";
import { Type } from "class-transformer";

export class AddressDto {
  @IsNotEmpty()
  @ApiModelProperty()
  city: string;

  @IsNotEmpty()
  @ApiModelProperty()
  @ValidateNested({ each: true })
  @Type(() => CountryDto)
  country: CountryDto;
}
