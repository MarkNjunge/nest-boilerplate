import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { CustomLogger } from "../CustomLogger";
import { Request, Response } from "express";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  logger: CustomLogger;

  constructor() {
    this.logger = new CustomLogger("TRACE");
  }
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const method = request.method;
    const url = request.url;

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(
            `${method} ${url} - ${response.statusCode} - ${Date.now() - now}ms`,
            context.getClass().name,
          ),
        ),
      );
  }
}
