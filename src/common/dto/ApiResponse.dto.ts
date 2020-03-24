import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class ApiRespnseDto {
  @ApiProperty()
  status: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  @IsOptional()
  meta?: any;
}
