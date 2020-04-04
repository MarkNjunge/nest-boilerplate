import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { ServerResponse, IncomingMessage } from "http";
import { CustomLogger } from "../logging/CustomLogger";
import { ApiResponseDto } from "../dto/ApiResponse.dto";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  logger: CustomLogger;

  constructor() {
    this.logger = new CustomLogger("HttpExceptionFilter");
  }

  catch(e: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply<ServerResponse>>();
    const request = ctx.getRequest<FastifyRequest<IncomingMessage>>();

    // Get the location where the error was thrown from to use as a logging tag
    const stackTop = e.stack.split("\n")[1].split("at ")[1].split(" ")[0];

    // Get the correct http status
    const status =
      e instanceof HttpException
        ? e.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    response.res.statusCode = status;

    const message = e.message;
    const logMessage: ApiResponseDto = {
      status,
      message,
    };

    if (e instanceof HttpException && (e.getResponse() as any).meta) {
      logMessage.meta = (e.getResponse() as any).meta;
    }

    this.logger.error(message, stackTop, { stacktrace: e.stack });
    this.logger.logRoute(request, response, { ...logMessage });

    response.status(status).send({
      ...logMessage,
    });
  }
}
