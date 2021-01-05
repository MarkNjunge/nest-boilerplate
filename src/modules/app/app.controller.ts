import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { CustomLogger } from "../../common/logging/CustomLogger";
import { CorrelationId } from "../../decorators/correlation-id.decorator";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@CorrelationId() correlationId: string): string {
    new CustomLogger().debug(correlationId);

    return this.appService.getHello(correlationId);
  }
}
