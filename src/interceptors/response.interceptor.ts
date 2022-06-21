import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();

    const correlationId = request.headers["x-correlation-id"] as string;

    return next.handle()
      .pipe(
        tap(() => {
          const response = ctx.getResponse<FastifyReply>();
          void response.header("x-correlation-id", correlationId);
        }),
      );
  }
}
