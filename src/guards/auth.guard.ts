import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { FastifyRequest } from "fastify";
import { config } from "../config";
import { ErrorCodes } from "../utils/error-codes";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: FastifyRequest = context.switchToHttp().getRequest();

    return validateRequest(request);
  }
}

function validateRequest(request: FastifyRequest): boolean {
  const authHeader: string | undefined = request.headers.authorization;
  const match = (authHeader ?? "").match(/Bearer (.*)/i);
  const apiKey = match ? match[1] : null;

  if (apiKey !== config.apiKey) {
    throw new ForbiddenException({
      message: "Invalid api key",
      code: ErrorCodes.INVALID_API_KEY,
    });
  }

  return true;
}
