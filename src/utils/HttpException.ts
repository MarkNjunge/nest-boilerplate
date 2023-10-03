import { ErrorCodes } from "./error-codes";

export class HttpException extends Error {
  status: number;

  message: string;

  code: string;

  meta?: any;

  constructor(
    status: number,
    message: string,
    code?: string,
    meta: any = undefined,
  ) {
    super(message);
    this.status = status;
    this.message = message;
    this.code = code ?? ErrorCodes.INTERNAL_ERROR;
    this.meta = meta;
  }
}
