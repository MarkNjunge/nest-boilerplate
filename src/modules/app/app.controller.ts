import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { Logger } from "../../logging/Logger";
import { CorrelationId } from "../../decorators/correlation-id.decorator";

@Controller()
export class AppController {
  private logger = new Logger("AppController");

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@CorrelationId() correlationId: string): string {
    this.logger.debug(correlationId);

    return this.appService.getHello(correlationId);
  }
}
