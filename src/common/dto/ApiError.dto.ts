import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { ErrorCodes } from "../error-codes";

export class ApiErrorDto {
  @ApiProperty()
  status: number;

  @ApiProperty()
  code: ErrorCodes;

  @ApiProperty()
  message: string;

  @ApiProperty()
  @IsOptional()
  meta?: any;
}
