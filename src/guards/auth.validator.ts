import { AuthenticatedUser } from "@/models/auth/auth";

export abstract class AuthValidator {
  abstract validateToken(token: string, mode?: string): AuthenticatedUser | null;
}
