import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class ApiResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  @IsOptional()
  meta?: any;
}
