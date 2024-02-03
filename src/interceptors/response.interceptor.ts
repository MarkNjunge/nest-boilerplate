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

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();

    const correlationId = request.headers["x-correlation-id"] as string;
    const ip = request.headers["x-ip"] as string;
    const clz = this.reflector.get<ClassConstructor<any>>(
      SerializeKey,
      context.getHandler(),
    );

    return next
      .handle()
      .pipe(tap(() => {
        // Cleanup any files uploaded
        FileHandler.deleteRequestFiles(request);
      }))
      .pipe(
        tap(() => {
          const response = ctx.getResponse<FastifyReply>();
          void response.header("x-correlation-id", correlationId);
          void response.header("x-ip", ip);
        }),
      )
      .pipe(
        map(data => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (clz) {
            return ResponseUtils.cleanObject(clz, data);
          } else {
            return data;
          }
        }),
      );
  }
}
