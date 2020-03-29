import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { IncomingMessage } from "http";
import { FastifyRequest } from "fastify";
import { config } from "../Config";

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
  request: FastifyRequest<IncomingMessage>,
): Promise<boolean> {
  const apiKey = request.headers["x-api-key"];

  if (apiKey !== config.apiKey) {
    throw new ForbiddenException({ message: "Invalid api key" });
  }

  return true;
}
