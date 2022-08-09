import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { IReqCtx, ReqCtx } from "@/decorators/request-context.decorator";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@ReqCtx() ctx: IReqCtx): string {
    return this.appService.getHello(ctx);
  }
}
