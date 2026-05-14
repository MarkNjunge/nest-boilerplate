import { ApiProperty } from "@nestjs/swagger";

export class DeletedDto {
  @ApiProperty()
  affected: number;
}
