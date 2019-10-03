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

@Catch(Error)
export class ErrorFilter implements ExceptionFilter {
  logger: CustomLogger;

  constructor() {
    this.logger = new CustomLogger("ErrorFilter");
  }

  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply<ServerResponse>>();
    const request = ctx.getRequest<FastifyRequest<IncomingMessage>>();

    const stackTop = error.stack
      .split("\n")[1]
      .split("at ")[1]
      .split(" ")[0];
    const message = error.message;
    const logMessage = {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
    };
    this.logger.error(JSON.stringify(logMessage), null, stackTop);

    const method = request.req.method;
    const url = request.req.url;
    const requestTime = request.params.requestTime;
    this.logger.log(`${method} ${url} - ${HttpStatus.INTERNAL_SERVER_ERROR} - ${Date.now() - requestTime}ms`, "TRACE");

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      ...logMessage,
    });
  }
}
