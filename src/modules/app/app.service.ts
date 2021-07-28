import { Injectable } from "@nestjs/common";
import { Logger } from "../../logging/Logger";

@Injectable()
export class AppService {
  logger: Logger = new Logger("AppService");

  getHello(correlationId: string): string {
    this.logger.debug(`Hello ${correlationId}`, "AppService.getHello");

    return "Hello World!";
  }
}
