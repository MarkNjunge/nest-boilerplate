import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { ServerResponse, IncomingMessage } from "http";
import { CustomLogger } from "../CustomLogger";

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
    const status =
      e instanceof HttpException
        ? e.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Get the location where the error was thrown from to use as a logging tag
    const stackTop = e.stack
      .split("\n")[1]
      .split("at ")[1]
      .split(" ")[0];
    const message = e.message.message || e.message;
    const meta = e.message.meta;
    const logMessage = {
      status,
      message,
      meta,
    };

    this.logger.error(JSON.stringify(logMessage), null, stackTop);

    const method = request.req.method;
    const url = request.req.url;
    const requestTime = request.params.requestTime;

    this.logger.log(
      `${method} ${url} - ${status} - ${Date.now() - requestTime}ms`,
      "TRACE",
    );

    response.status(status).send({
      ...logMessage,
    });
  }
}
