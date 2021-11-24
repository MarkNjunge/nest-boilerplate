export class HttpException extends Error {
  status: number;

  message: string;

  code?: string;

  meta: any;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(status: number, message: string, code?: string, meta: any = {}) {
    super(message);
    this.status = status;
    this.message = message;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.meta = meta;
  }
}
