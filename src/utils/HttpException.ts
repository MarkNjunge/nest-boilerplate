export class HttpException extends Error {
  status: number;

  message: string;

  code?: string;

  meta: any;

  constructor(status: number, message: string, code?: string, meta: any = {}) {
    super(message);
    this.status = status;
    this.message = message;
    this.meta = meta;
  }
}
