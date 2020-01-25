import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../common/CustomLogger";

@Injectable()
export class AppService {
  logger: CustomLogger = new CustomLogger("AppService");

  getHello(): string {
    this.logger.debug("Hello!", "AppService.getHello");
    return "Hello World!";
  }
}
