import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { emptyCtx } from "@/decorators/request-context.decorator";
import { ClsModule } from "nestjs-cls";

describe("AppController", () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClsModule],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  describe("root", () => {
    it("should return 'Hello World!'", () => {
      jest
        .spyOn(appService, "getHello")
        .mockImplementation(() => "Hello World!");

      expect(appController.getHello(emptyCtx())).toBe("Hello World!");
    });
  });
});
