import { ApiProperty } from "@nestjs/swagger";

export class ApiResponseDto {
  @ApiProperty()
  message: string;
}
