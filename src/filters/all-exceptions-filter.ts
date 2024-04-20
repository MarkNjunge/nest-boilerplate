/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { ExceptionFilter, Catch, ArgumentsHost } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { Logger } from "@/logging/Logger";
import { ApiErrorDto } from "@/models/_shared/ApiError.dto";
import { getErrorCode, HttpException, parseStacktrace } from "@/utils";
import { DBError } from "objection";
import { FileHandler } from "@/utils/file-handler";

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

    // The 'fields' field of MultipartFile is a circular reference,
    // which will cause a "Maximum call stack size exceeded" error in redact
    FileHandler.removeCircularFields(request);

    // Cleanup any files uploaded
    FileHandler.deleteRequestFiles(request, true);

    // Get the location where the error was thrown from to use as a logging tag
    const parsedStack = parseStacktrace(e.stack ?? "");
    const tag =
      parsedStack.length > 0 ? parsedStack[0].methodName : "<unknown>";

    // Get the correct http status
    const httpE = e as HttpException;
    const { status, code, meta } = {
      status: httpE.status ?? 500,
      code: httpE.code ?? getErrorCode(httpE.status ?? 500),
      meta: httpE.meta ?? undefined,
    };
    response.statusCode = status;

    const correlationId = request.headers["x-correlation-id"] as string;
    const ip = request.headers["x-ip"] as string;
    response.header("x-correlation-id", correlationId);
    response.header("x-ip", ip);

    const message = e instanceof DBError ? e.name : e.message;
    const apiError: ApiErrorDto = {
      status,
      message,
      code,
      correlationId,
      meta,
    };

    this.logger.error(message, { tag, ctx: { correlationId, ip } }, e);
    this.logger.logRoute(request, response, { ...apiError });

    void response.status(status).send(apiError);
  }
}
