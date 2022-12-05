import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { map, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Reflector } from "@nestjs/core";
import { ClassConstructor } from "class-transformer";
import { CleanResponseKey } from "@/decorators/clean-response.decorator";
import { ResponseUtils } from "@/utils";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();

    const correlationId = request.headers["x-correlation-id"] as string;
    const ip = request.headers["x-ip"] as string;
    const clz = this.reflector.get<ClassConstructor<any>>(CleanResponseKey, context.getHandler());

    return next.handle()
      .pipe(
        tap(() => {
          const response = ctx.getResponse<FastifyReply>();
          void response.header("x-correlation-id", correlationId);
          void response.header("x-ip", ip);
        }),
      )
      .pipe(map(data => {
        if (clz) {
          return ResponseUtils.cleanObject(clz, data);
        } else {
          return data;
        }
      }));
  }
}
