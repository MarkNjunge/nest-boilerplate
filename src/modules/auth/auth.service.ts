import { Injectable } from "@nestjs/common";
import { config } from "@/config";
import { AuthenticatedUser } from "@/models/auth/auth";
import { AuthValidator } from "@/guards/auth.validator";

@Injectable()
export class AuthService extends AuthValidator {
  validateToken(token: string): AuthenticatedUser | null {
    if (token === config.apiKey) {
      return { userId: "sample-user-id" };
    }
    return null;
  }
}
