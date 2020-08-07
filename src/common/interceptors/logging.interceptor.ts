import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { CustomLogger } from "../logging/CustomLogger";
import { FastifyReply, FastifyRequest } from "fastify";
import { ServerResponse, IncomingMessage } from "http";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  logger: CustomLogger;

  constructor() {
    this.logger = new CustomLogger("ROUTE");
  }
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    return next
      .handle()
      .pipe(tap((data) => this.logger.logRoute(request, response, data)));
  }
}
