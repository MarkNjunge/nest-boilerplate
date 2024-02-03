import { Body, Controller, Get, Post } from "@nestjs/common";
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

  @Post("/upload")
  @ApiConsumes("multipart/form-data")
  @ApiBody({type:FileUploadDto})
  upload(@Body() body: FileUploadDto) {
    return body;
  }
}
