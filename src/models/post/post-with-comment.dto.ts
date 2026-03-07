import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class CommentContentDto {
  @ApiProperty()
  @IsNotEmpty()
  content: string;
}

export class CreatePostWithCommentDto {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ type: CommentContentDto })
  @ValidateNested()
  @Type(() => CommentContentDto)
  comment: CommentContentDto;
}
