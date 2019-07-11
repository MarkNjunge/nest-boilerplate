import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { ServerResponse, IncomingMessage } from "http";
import { CustomLogger } from "../CustomLogger";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  logger: CustomLogger;

  constructor() {
    this.logger = new CustomLogger("HttpExceptionFilter");
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply<ServerResponse>>();
    const request = ctx.getRequest<FastifyRequest<IncomingMessage>>();
    const status = exception.getStatus();

    const stackTop = exception.stack
      .split("\n")[1]
      .split("at ")[1]
      .split(" ")[0];
    const message = exception.message.message || exception.message;
    const meta = exception.message.meta;
    const logMessage = {
      status,
      message,
      meta,
    };
    this.logger.error(JSON.stringify(logMessage), null, stackTop);

    response.status(status).send({
      ...logMessage,
    });
  }
}
