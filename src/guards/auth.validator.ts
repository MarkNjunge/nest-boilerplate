import { SetMetadata } from "@nestjs/common";
import { AuthenticatedUser } from "@/models/auth/auth";

export const AUTH_MODE_KEY = "auth_mode";
export type AuthModes = "USER" | "ADMIN";

export const AuthMode = (mode: AuthModes) => SetMetadata(AUTH_MODE_KEY, mode);

export abstract class AuthValidator {
  abstract validateUser(token: string): AuthenticatedUser | null;
  abstract validateAdmin(token: string): boolean;
}
