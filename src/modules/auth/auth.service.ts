import { Injectable } from "@nestjs/common";
import { config } from "@/config";
import { AuthenticatedUser } from "@/models/auth/auth";

@Injectable()
export class AuthService {
  validateToken(token: string): AuthenticatedUser | null {
    if (token === config.apiKey) {
      return { userId: "sample-user-id" };
    }
    return null;
  }
}
