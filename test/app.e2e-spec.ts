import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";
import { INestApplication, HttpServer } from "@nestjs/common";
import { AppService } from "../src/app/app.service";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { initializeWinston } from "../src/common/logging/CustomLogger";
import { UserDto } from "../src/users/dto/user.dto";
import { ValidationPipe } from "../src/common/pipes/validation.pipe";
import { CreateUserDto } from "src/users/dto/CreateUser.dto";

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
      // Use custom service
      // .overrideProvider(AppService)
      // .useValue(appService)
      .compile();

    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Wait for fastify
    await app.getHttpAdapter().getInstance().ready();

    server = app.getHttpServer();
  });

  it("GET /", () => {
    return request(server).get("/").expect(200).expect("Hello World!");
  });

  describe("users", () => {
    it("POST /users", (done) => {
      const dto: CreateUserDto = {
        username: "mark",
        contact: { email: "mark@mail.com" },
      };
      const res = {
        username: "mark",
        contact: { email: "mark@mail.com", id: 1 },
        id: 1,
      };

      return request(server)
        .post("/users")
        .send(dto)
        .set("x-api-key", "api-key")
        .expect("Content-Type", /json/)
        .expect(201, done);
      // .expect(JSON.stringify(res));
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
