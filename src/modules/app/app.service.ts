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
    this.logger = new Logger("AppService");
  }

  getHello(ctx: IReqCtx): string {
    // ctx.traceId and this.clsService.getId() will have the same value
    const traceId = ctx.traceId;
    this.logger.debug(`Request with id ${traceId}`, {
      tag: "AppService.getHello",
      data: { traceId: this.clsService.getId() }
    });

    return `Hello ${traceId}!`;
  }

  ready(): ApiResponseDto {
    return { message: "OK" };
  }

  async live(): Promise<{ ok: boolean; [key: string]: any }> {
    const response = {
      ok: true,
      message: "OK",
      db: await this.checkDatabase()
    };

    if (!response.db.ok) {
      response.ok = false;
      response.message = "App is not live";
    }

    return response;
  }

  private async checkDatabase(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.dbService.testConnection();
      return { ok: true, message: "Database OK" };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  }
}
