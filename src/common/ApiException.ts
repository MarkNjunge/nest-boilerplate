import { HttpException } from "@nestjs/common";

export class ApiException extends HttpException {
  constructor(statusCode: number, message: string, meta?: any) {
    if (meta) {
      super({ message, meta }, statusCode);
    } else {
      super(message, statusCode);
    }
  }
}
