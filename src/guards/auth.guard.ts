import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { ClsService } from "nestjs-cls";
import { AuthService } from "@/modules/auth/auth.service";
import { AppClsStore, CLS_AUTH_USER } from "@/cls/app-cls";
import { ErrorCodes, HttpException } from "@/utils";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly clsService: ClsService<AppClsStore>,
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

    this.clsService.set(CLS_AUTH_USER, user);

    return true;
  }
}
