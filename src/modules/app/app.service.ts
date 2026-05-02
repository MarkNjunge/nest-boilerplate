import { Injectable } from "@nestjs/common";
import { Logger } from "@/logging/Logger";
import { IReqCtx } from "@/decorators/request-context.decorator";
import { ApiResponseDto } from "@/models/_shared/ApiResponse.dto";
import { AppAlsService } from "@/als/app-als.service";
import { DbService } from "@/modules/_db/db.service";
import { ErrorCodes, HttpException } from "@/utils";

@Injectable()
export class AppService {
  logger: Logger;

  constructor(
    private readonly dbService: DbService
  ) {
    this.logger = new Logger("AppService");
  }

  getHello(ctx: IReqCtx): string {
    // ctx.traceId and alsService.getId() will have the same value
    const traceId = ctx.traceId;
    this.logger.debug(`Request with id ${traceId}`, {
      tag: "AppService.getHello",
      data: { ranAt: new Date().toISOString() }
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
    } catch (e: any) {
      return { ok: false, message: e.message };
    }
  }
}
