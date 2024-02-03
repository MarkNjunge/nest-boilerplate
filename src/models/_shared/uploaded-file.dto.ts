import { IsNotEmpty } from "class-validator";

export class UploadedFileDto {
  @IsNotEmpty()
  filepath: string;

  @IsNotEmpty()
  field: string;

  @IsNotEmpty()
  filename: string;

  @IsNotEmpty()
  mimetype: string;

  @IsNotEmpty()
  isFile: boolean; // For ease in deleting files. Always true
}