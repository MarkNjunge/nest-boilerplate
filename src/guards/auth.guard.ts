import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { AuthService } from "@/modules/auth/auth.service";
import { AppAlsService, ALS_AUTH_USER } from "@/als/app-als.service";
import { ErrorCodes, HttpException } from "@/utils";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly alsService: AppAlsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request: FastifyRequest = context.switchToHttp().getRequest();

    const authHeader: string | undefined = request.headers.authorization;
    const match = (authHeader ?? "").match(/Bearer (.*)/i);
    const token = match ? match[1] : null;

    if (!token) {
      throw new HttpException(
        401,
        "Invalid authentication",
        ErrorCodes.INVALID_AUTHENTICATION,
      );
    }

    const user = this.authService.validateToken(token);

    if (!user) {
      throw new HttpException(
        401,
        "Invalid authentication",
        ErrorCodes.INVALID_AUTHENTICATION,
      );
    }

    this.alsService.set(ALS_AUTH_USER, user);

    return true;
  }
}
