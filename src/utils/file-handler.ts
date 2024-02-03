import { MultipartFile } from "@fastify/multipart";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { UploadedFileDto } from "@/models/_shared/uploaded-file.dto";
import { FastifyRequest } from "fastify";
import { HttpException } from "@/utils/HttpException";
import { ErrorCodes } from "@/utils/error-codes";
import { config } from "@/config";
import * as util from "util";
import * as stream from "stream";
import { Logger } from "@/logging/Logger";

const pump = util.promisify(stream.pipeline);

const logger = new Logger("FileHandler");
export class FileHandler {

  static async writeUploadFile(part: MultipartFile): Promise<UploadedFileDto> {
    const uploadPath = path.resolve(config.fileUpload.uploadDir) || os.tmpdir();
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // No file was passed in the field
    if (!part.filename) {
      part.filename = (Math.random() * 10000).toFixed(0);
    }

    const filepath = path.join(uploadPath, part.filename);
    logger.debug(`Writing file to ${filepath}`);
    const writeStream = fs.createWriteStream(filepath);
    await pump(part.file, writeStream);

    const truncated = part.file.truncated;

    if (truncated) {
      fs.unlinkSync(filepath);
      throw new HttpException(413, `${part.fieldname} is too big`, ErrorCodes.FILE_TOO_LARGE);
    }

    return {
      filepath,
      field: part.fieldname,
      filename: part.filename,
      mimetype: part.mimetype,
      isFile: true
    };
  }

  static removeCircularFields(request: FastifyRequest): any {
    if (!request.headers["content-type"]?.includes("multipart/form-data")) {
      return;
    }

    Object.keys(request.body || {}).forEach(key => {
      delete request.body?.[key].file;
      delete request.body?.[key].fields;
      delete request.body?.[key].toBuffer;
    });

    return request.body;
  }

  static deleteRequestFiles(request: FastifyRequest, hasFailed: boolean = false) {
    if (!request.headers["content-type"]?.includes("multipart/form-data")) {
      return;
    }

    function handleDto(dto: UploadedFileDto) {
      if (dto.isFile) {
        if (fs.existsSync(dto.filepath)) {
          logger.debug(`Deleting file from ${dto.filepath}`);
          fs.unlinkSync(dto.filepath);
        }
      }
    }

    if (config.fileUpload.removeAfterUpload || hasFailed) {
      Object.keys(request.body || {}).forEach(key => {
        const dto = request.body?.[key] as UploadedFileDto;
        if (Array.isArray(dto)) {
          dto.forEach(d => handleDto(d));
        } else {
          handleDto(dto);
        }
      });
    }
  }
}