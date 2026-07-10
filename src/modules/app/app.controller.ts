import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import { AppService } from "./app.service";
import { IReqCtx, ReqCtx } from "@/decorators/request-context.decorator";
import { FileUploadDto } from "@/models/file-upload/file-upload.dto";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { FastifyReply } from "fastify";
import { AuthGuard } from "@/guards/auth.guard";
import { SkipAuth } from "@/guards/skip-auth.decorator";

@Controller()
@UseGuards(AuthGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SkipAuth()
  getHello(@ReqCtx() ctx: IReqCtx): string {
    return this.appService.getHello(ctx);
  }

  @Get("/live")
  @SkipAuth()
  live() {
    return this.appService.live();
  }

  @Get("/ready")
  @SkipAuth()
  async ready(@Res({ passthrough: true }) res: FastifyReply) {
    const liveRes = await this.appService.ready();
    if (!liveRes.ok) {
      res.status(500);
    }
    return liveRes;
  }

  @Post("/upload")
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: FileUploadDto })
  upload(@Body() body: FileUploadDto) {
    return body;
  }
}
