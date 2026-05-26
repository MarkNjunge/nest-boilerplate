import { Injectable } from "@nestjs/common";
import { config } from "@/config";
import { AuthenticatedUser } from "@/models/auth/auth";
import { AuthValidator } from "@/guards/auth.validator";

@Injectable()
export class AuthService extends AuthValidator {
  validateUser(token: string): AuthenticatedUser | null {
    return { userId: token };
  }

  validateAdmin(token: string): boolean {
    return token === config.auth.adminKey;
  }
}
