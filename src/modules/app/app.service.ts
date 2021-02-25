import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../../logging/CustomLogger";

@Injectable()
export class AppService {
  logger: CustomLogger = new CustomLogger("AppService");

  getHello(correlationId: string): string {
    this.logger.debug(`Hello ${correlationId}`, "AppService.getHello");

    return "Hello World!";
  }
}
