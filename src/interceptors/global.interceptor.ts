import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { map, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Reflector } from "@nestjs/core";
import { ClassConstructor } from "class-transformer";
import { ResponseUtils } from "@/utils";
import { SerializeKey } from "@/decorators/serialize.decorator";
import { FileHandler } from "@/utils/file-handler";
import { Logger } from "@/logging/Logger";

@Injectable()
export class GlobalInterceptor implements NestInterceptor {
  logger: Logger = new Logger("ROUTE");

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    const correlationId = request.headers["x-correlation-id"] as string;
    const ip = request.headers["x-ip"] as string;
    const clz = this.reflector.get<ClassConstructor<any> | undefined>(
      SerializeKey,
      context.getHandler(),
    );

    return next
      .handle()
      .pipe(
        tap(data => {
          // Cleanup any files uploaded
          FileHandler.deleteRequestFiles(request);

          // Add response headers
          void response.header("x-correlation-id", correlationId);
          void response.header("x-ip", ip);

          // Clean object
          if (clz != undefined) {
            data = ResponseUtils.cleanObject(clz, data);
          }

          // Log route
          this.logger.logRoute(request, response, data);

          return data;
        }),
      );
  }
}
