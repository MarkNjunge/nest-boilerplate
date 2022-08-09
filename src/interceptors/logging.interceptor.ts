import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Logger } from "@/logging/Logger";
import { FastifyReply, FastifyRequest } from "fastify";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  logger: Logger;

  constructor() {
    this.logger = new Logger("ROUTE");
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    return next
      .handle()
      .pipe(tap(data => this.logger.logRoute(request, response, data)));
  }
}
