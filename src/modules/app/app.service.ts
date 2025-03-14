import { Injectable } from "@nestjs/common";
import { Logger } from "@/logging/Logger";
import { IReqCtx } from "@/decorators/request-context.decorator";
import { AppClsStore } from "@/cls/app-cls";
import { ApiResponseDto } from "@/models/_shared/ApiResponse.dto";
import { ClsService } from "nestjs-cls";

@Injectable()
export class AppService {
  logger: Logger;

  constructor(
    private readonly clsService: ClsService<AppClsStore>
  ) {
    this.logger = new Logger("AppService", clsService);
  }

  getHello(ctx: IReqCtx): string {
    // ctx.traceId and this.clsService.getId() will have the same value
    const traceId = ctx.traceId;
    this.logger.debug(`Request from ${ctx.ip} with id ${traceId}`, {
      tag: "AppService.getHello",
      data: { traceId: this.clsService.getId() }
    });

    return `Hello ${traceId}!`;
  }
}
