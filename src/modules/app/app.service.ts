import { Injectable } from "@nestjs/common";
import { Logger } from "../../logging/Logger";
import { IReqCtx } from "../../decorators/request-context.decorator";

@Injectable()
export class AppService {
  logger: Logger = new Logger("AppService");

  getHello({ correlationId }: IReqCtx): string {
    this.logger.debug(`Hello ${correlationId}`, "AppService.getHello");

    return `Hello ${correlationId}!`;
  }
}
