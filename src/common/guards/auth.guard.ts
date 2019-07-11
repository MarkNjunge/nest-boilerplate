import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { IncomingMessage } from "http";
import { FastifyRequest } from "fastify";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: FastifyRequest<IncomingMessage> = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}

async function validateRequest(request: FastifyRequest<IncomingMessage>): Promise<boolean> {
  return true;
}
