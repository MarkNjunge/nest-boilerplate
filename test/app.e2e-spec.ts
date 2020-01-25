import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";
import { INestApplication, HttpServer } from "@nestjs/common";
import { AppService } from "../src/app/app.service";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { initializeWinston } from "../src/common/CustomLogger";
import { UserDto } from "../src/users/dto/user.dto";

describe("AppController (e2e)", () => {
  let app: INestApplication;
  const appService = {
    getHello: () => "Hello World!",
    createUser: (userDto: UserDto) => userDto,
  };
  let server: HttpServer;

  beforeAll(() => {
    // Prevents Winston error 'Attempt to write logs with no transports'
    initializeWinston();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AppService)
      .useValue(appService)
      .compile();

    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();

    // Wait for fastify
    await app
      .getHttpAdapter()
      .getInstance()
      .ready();

    server = app.getHttpServer();
  });

  it("GET /", () => {
    return request(server)
      .get("/")
      .expect(200)
      .expect(appService.getHello());
  });

  it("POST /", () => {
    const userDto = new UserDto();
    userDto.username = "Mark";

    return request(server)
      .post("/")
      .send(userDto)
      .expect(201)
      .expect(JSON.stringify(userDto));
  });

  afterAll(async () => {
    await app.close();
  });
});
