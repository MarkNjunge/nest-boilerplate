import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { Logger } from "@/logging/Logger";
import { ApiErrorDto } from "@/models/_shared/ApiError.dto";
import { ErrorCodes, getErrorCode, parseStacktrace } from "@/utils";
import { FileHandler } from "@/utils/file-handler";
import { AppAlsService } from "@/als/app-als.service";
import { QueryFailedError } from "typeorm";
import { config } from "@/config";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  logger: Logger;

  constructor(
    protected readonly alsService: AppAlsService,
  ) {
    this.logger = new Logger("HttpExceptionFilter");
  }

  catch(e: Error, host: ArgumentsHost): void {
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

    if (e instanceof QueryFailedError) {
      (e as any).code = ErrorCodes.DB_ERROR;
      if (config.env === "development") {
        (e as any).meta = {
          query: e.query,
          parameters: e.parameters,
        };
      } else {
        e.message = "Database error";
      }
    }

    const { status, code, meta } = AllExceptionsFilter.getErrorDetails(e);
    response.statusCode = status;

    const traceId = this.alsService.getId();

    response.header("x-trace-id", traceId);

    const apiError: ApiErrorDto = {
      status,
      message: e.message,
      code,
      traceId,
      meta,
    };

    this.logger.error(e.message, { tag }, e);
    // eslint-disable-next-line @typescript-eslint/no-misused-spread
    this.logger.logRoute(request, response, { ...apiError });

    void response.status(status).send(apiError);
  }

  /**
   * Nest exceptions carry the status, an optional `errorCode`, and an optional `meta` in their response object.
   * Other errors may set `status`, `code` and `meta` directly.
   */
  static getErrorDetails(e: Error): { status: number; code: string; meta?: any } {
    if (e instanceof HttpException) {
      const status = e.getStatus();
      const body = e.getResponse();
      return {
        status,
        code: e.errorCode ?? getErrorCode(status),
        meta: typeof body === "object" ? (body as { meta?: any }).meta : undefined,
      };
    }

    const err = e as Error & { status?: number; code?: string; meta?: any };
    const status = err.status ?? 500;
    return {
      status,
      code: err.code ?? getErrorCode(status),
      meta: err.meta,
    };
  }
}
