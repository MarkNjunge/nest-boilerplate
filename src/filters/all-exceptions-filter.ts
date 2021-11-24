import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { Logger } from "../logging/Logger";
import { ApiErrorDto } from "../modules/shared/dto/ApiError.dto";
import { ErrorCodes } from "../utils/error-codes";
import { HttpException } from "../utils/HttpException";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  logger: Logger;

  constructor() {
    this.logger = new Logger("HttpExceptionFilter");
  }

  // eslint-disable-next-line max-lines-per-function
  catch(e: HttpException | Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    // Get the location where the error was thrown from to use as a logging tag
    const stackTop = e.stack?.split("\n")[1].split("at ")[1].split(" ")[0];

    // Get the correct http status
    const status = e instanceof HttpException ? e.status : 500;
    response.statusCode = status;

    // Get appropriate error code
    let code = ErrorCodes.INTERNAL_ERROR;
    if (status.toString().match(/404/g) !== null) {
      code = ErrorCodes.NOT_FOUND;
    } else if (status.toString().match(/4.*/g) !== null) {
      code = ErrorCodes.CLIENT_ERROR;
    }

    const correlationId = request.headers["x-correlation-id"] as string;
    const message = e.message;
    const apiError: ApiErrorDto = {
      status,
      message,
      code,
      correlationId,
    };
    if (e instanceof HttpException && e.meta !== null) {
      if (e.code != null) {
        apiError.code = e.code;
      }
      if (e.meta != null) {
        apiError.meta = e.meta;
      }
    }

    this.logger.error(message, stackTop, { stacktrace: e.stack });
    this.logger.logRoute(request, response, { ...apiError });

    void response.status(status).send(apiError);
  }
}
