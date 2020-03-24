import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";
import { IncomingMessage } from "http";
import { FastifyRequest } from "fastify";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: FastifyRequest<IncomingMessage> = context
      .switchToHttp()
      .getRequest();
    return validateRequest(request);
  }
}

async function validateRequest(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  request: FastifyRequest<IncomingMessage>,
): Promise<boolean> {
  return true;
}
