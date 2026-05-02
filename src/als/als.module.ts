import { Global, Module } from "@nestjs/common";
import { AppAlsService } from "./app-als.service";

@Global()
@Module({
  providers: [AppAlsService],
  exports: [AppAlsService],
})
export class AppAlsModule {}
