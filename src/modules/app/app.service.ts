import { Injectable } from "@nestjs/common";
import { Logger } from "@/logging/Logger";
import { IReqCtx } from "@/decorators/request-context.decorator";
import { AppClsStore } from "@/cls/app-cls";
import { ApiResponseDto } from "@/models/_shared/ApiResponse.dto";
import { ClsService } from "nestjs-cls";
import { DbService } from "@/modules/_db/db.service";
import { ErrorCodes, HttpException } from "@/utils";

@Injectable()
export class AppService {
  logger: Logger;

  constructor(
    private readonly clsService: ClsService<AppClsStore>,
    private readonly dbService: DbService
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

  ready(): ApiResponseDto {
    return { message: "OK" };
  }

  async live(): Promise<any> {
    let response = {
      ok: true,
      message: "OK",
      db: {
        message: "OK"
      }
    };

    try {
      await this.dbService.testConnection();
    } catch (e) {
      response.ok = false;
      response.db.message = e.message;
    }

    if (!response.ok) {
      response.message = "App is not live";
      throw new HttpException(500, response.message, ErrorCodes.LIVE_ERROR, response);
    } else {
      return response;
    }
  }
}
