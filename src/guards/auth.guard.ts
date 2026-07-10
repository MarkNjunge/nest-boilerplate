import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { AuthValidator, AuthModes, AUTH_MODE_KEY } from "@/guards/auth.validator";
import { AppAlsService, ALS_AUTH_USER, ALS_AUTH_ADMIN } from "@/als/app-als.service";
import { AuthenticatedUser } from "@/models/auth/auth";
import { ErrorCodes, HttpException } from "@/utils";
import { SKIP_AUTH_KEY } from "@/guards/skip-auth.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authValidator: AuthValidator,
    private readonly alsService: AppAlsService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request: FastifyRequest = context.switchToHttp().getRequest();

    const skipAuth = this.reflector.getAllAndOverride<boolean | undefined>(SKIP_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipAuth === true) {
      return true;
    }

    const mode = this.reflector.getAllAndOverride<AuthModes | undefined>(AUTH_MODE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const authHeader: string | undefined = request.headers.authorization;
    const match = (authHeader ?? "").match(/Bearer (.*)/i);
    const token = match ? match[1] : null;

    if (!token) {
      throw new HttpException(
        401,
        "Missing authentication",
        ErrorCodes.MISSING_AUTHENTICATION,
      );
    }

    let valid: boolean;
    let user: AuthenticatedUser | null = null;
    let isAdmin = false;

    if (mode === "ADMIN") {
      valid = this.authValidator.validateAdmin(token);
      isAdmin = valid;
    } else {
      const result = this.authValidator.validateUser(token);
      valid = result !== null;
      user = result;
    }

    if (!valid) {
      throw new HttpException(
        401,
        "Invalid authentication",
        ErrorCodes.INVALID_AUTHENTICATION,
      );
    }

    if (user != null) {
      this.alsService.set(ALS_AUTH_USER, user);
    }
    if (isAdmin) {
      this.alsService.set(ALS_AUTH_ADMIN, true);
    }

    return true;
  }
}
