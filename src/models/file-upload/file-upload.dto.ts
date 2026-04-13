import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import { UploadedFileDto } from "@/models/_shared/uploaded-file.dto";
import { ApiProperty } from "@nestjs/swagger";

export class FileUploadDto {
  // Extra fields
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  ref: string;

  // Array of files
  @ApiProperty({ type: "array", items: { type: "file", format: "binary" } })
  @IsNotEmpty()
  @IsArray({ message: "$property must be multiple files" })
  @ValidateNested({ message: "$property must be a file", each: true })
  @Type(() => UploadedFileDto)
  file1: UploadedFileDto[];

  // Single file
  @ApiProperty({ type: "string", format: "binary" })
  @IsNotEmpty()
  @IsObject({ message: "$property must be a single file" })
  @ValidateNested({ message: "$property must be a file" })
  @Type(() => UploadedFileDto)
  file2: UploadedFileDto;
}
