import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class ApiResponseDto {
  @ApiProperty()
  status: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  @IsOptional()
  meta?: any;
}
