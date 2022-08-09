import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class ApiErrorDto {
  @ApiProperty()
  status: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  correlationId: string;

  @ApiProperty()
  @IsOptional()
  meta?: any;
}
