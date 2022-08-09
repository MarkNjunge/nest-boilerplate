import { Injectable } from "@nestjs/common";
import { Logger } from "@/logging/Logger";
import { IReqCtx } from "@/decorators/request-context.decorator";

@Injectable()
export class AppService {
  logger: Logger = new Logger("AppService");

  getHello(ctx: IReqCtx): string {
    this.logger.debug(`Hello ${ctx.correlationId}`, { tag: "AppService.getHello", ctx });

    return `Hello ${ctx.correlationId}!`;
  }
}
