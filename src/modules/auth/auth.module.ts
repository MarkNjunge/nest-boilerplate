import { Global, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthValidator } from "@/guards/auth.validator";

@Global()
@Module({
  providers: [
    AuthService,
    { provide: AuthValidator, useExisting: AuthService },
  ],
  exports: [AuthService, AuthValidator],
})
export class AuthModule {}
