import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { CustomLogger } from "../logging/CustomLogger";
import { ApiErrorDto } from "../dto/ApiError.dto";
import { ErrorCodes } from "../error-codes";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  logger: CustomLogger;

  constructor() {
    this.logger = new CustomLogger("HttpExceptionFilter");
  }

  catch(e: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    // Get the location where the error was thrown from to use as a logging tag
    const stackTop = e.stack.split("\n")[1].split("at ")[1].split(" ")[0];

    // Get the correct http status
    const status =
      e instanceof HttpException
        ? e.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    response.statusCode = status;

    // Get appropriate error code
    let code = ErrorCodes.INTERNAL_ERROR;
    if (status.toString().match(/404/g) != null) {
      code = ErrorCodes.NOT_FOUND;
    } else if (status.toString().match(/4.*/g) != null) {
      code = ErrorCodes.CLIENT_ERROR;
    }

    const message = e.message;
    const apiError: ApiErrorDto = {
      status,
      message,
      code,
    };
    if (e instanceof HttpException && (e.getResponse() as any).code) {
      apiError.code = (e.getResponse() as any).code;
    }

    if (e instanceof HttpException && (e.getResponse() as any).meta) {
      apiError.meta = (e.getResponse() as any).meta;
    }

    this.logger.error(message, stackTop, { stacktrace: e.stack });
    this.logger.logRoute(request, response, { ...apiError });

    response.status(status).send(apiError);
  }
}
