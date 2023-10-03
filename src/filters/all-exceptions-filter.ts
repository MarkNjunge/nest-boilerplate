/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { ExceptionFilter, Catch, ArgumentsHost } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { Logger } from "@/logging/Logger";
import { ApiErrorDto } from "@/models/_shared/ApiError.dto";
import { getErrorCode, HttpException, parseStacktrace } from "@/utils";
import { DBError } from "objection";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  logger: Logger;

  constructor() {
    this.logger = new Logger("HttpExceptionFilter");
  }

  catch(e: HttpException | Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    // Get the location where the error was thrown from to use as a logging tag
    const parsedStack = parseStacktrace(e.stack ?? "");
    const tag =
      parsedStack.length > 0 ? parsedStack[0].methodName : "<unknown>";

    // Get the correct http status
    const { status, code, meta } = {
      status: (e as HttpException).status ?? 500,
      code:
        (e as HttpException).code ??
        getErrorCode((e as HttpException).status ?? 500),
      meta: (e as HttpException).meta ?? undefined,
    };
    response.statusCode = status;

    const correlationId = request.headers["x-correlation-id"] as string;
    const ip = request.headers["x-ip"] as string;
    const message = e instanceof DBError ? e.name : e.message;
    const apiError: ApiErrorDto = {
      status,
      message,
      code,
      correlationId,
      meta,
    };

    this.logger.error(e, { tag, ctx: { correlationId, ip } });
    this.logger.logRoute(request, response, { ...apiError });

    void response.status(status).send(apiError);
  }
}
