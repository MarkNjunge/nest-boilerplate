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
import { parseStacktrace } from "../utils/stack-trace";

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
    const parsedStack = parseStacktrace(e.stack ?? "");
    const tag = parsedStack.length > 0 ? parsedStack[0].methodName : "<unknown>";

    // Determine if it's a http exception or a regular error
    const isHttp = e instanceof HttpException;

    // Get the correct http status
    const status = isHttp ? (e as HttpException).status : 500;
    response.statusCode = status;

    // Get appropriate error code
    const code = isHttp ? (e as HttpException).code : ErrorCodes.INTERNAL_ERROR;

    // Get any meta info
    const meta = isHttp ? (e as HttpException).meta : undefined;

    const correlationId = request.headers["x-correlation-id"] as string;
    const message = e.message;
    const apiError: ApiErrorDto = {
      status,
      message,
      code,
      correlationId,
      meta,
    };

    this.logger.error(message, { tag, data: { stacktrace: e.stack } });
    this.logger.logRoute(request, response, { ...apiError });

    void response.status(status).send(apiError);
  }
}
