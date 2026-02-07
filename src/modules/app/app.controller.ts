import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { AppService } from "./app.service";
import { IReqCtx, ReqCtx } from "@/decorators/request-context.decorator";
import { FileUploadDto } from "@/models/file-upload/file-upload.dto";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@ReqCtx() ctx: IReqCtx): string {
    return this.appService.getHello(ctx);
  }

  @Get("/ready")
  ready(){
    return this.appService.ready();
  }

  @Get("/live")
  async live(@Res({ passthrough: true }) res) {
    const liveRes = await this.appService.live();
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
