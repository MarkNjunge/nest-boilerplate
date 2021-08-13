/* eslint-disable max-lines-per-function */
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { INestApplication, HttpServer } from "@nestjs/common";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe } from "../src/pipes/validation.pipe";
import { CreateUserDto } from "src/modules/users/dto/CreateUser.dto";
import { CreateAddressDto } from "../src/modules/users/dto/CreateAddress.dto";
import { UpdateUserDto } from "../src/modules/users/dto/UpdateUser.dto";
import * as winston from "winston";
import { BlankTransport } from "./util/Blank.transport";

describe("AppController (e2e)", () => {
  let app: INestApplication;
  let server: HttpServer;

  beforeAll(async() => {
    // Prevents Winston error 'Attempt to write logs with no transports'
    winston.configure({
      level: "debug",
      format: winston.format.simple(),
      transports: [new BlankTransport()],
    });

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
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    /* eslint-disable @typescript-eslint/no-unsafe-call */
    await app.getHttpAdapter().getInstance()
      .ready();
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
    /* eslint-enable @typescript-eslint/no-unsafe-call */

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    server = app.getHttpServer();
  });

  describe("/", () => {
    it("GET /", done => {
      void request(server)
        .get("/")
        .expect(200)
        .expect("Hello World!", done);
    });
  });

  describe("/users", () => {
    it("GET /users", done => {
      void request(server)
        .get("/users")
        .expect("Content-Type", /json/)
        .expect(200, done);
    });
    it("POST /users", done => {
      const dto: CreateUserDto = {
        username: "mark",
        contact: { email: "mark@mail.com" },
      };

      void request(server)
        .post("/users")
        .send(dto)
        .set("x-api-key", "api-key")
        .expect("Content-Type", /json/)
        .expect(201, done);
    });
    it("POST /users/{id}/addresses", done => {
      const dto: CreateAddressDto = {
        city: "Nairobi",
        country: "Kenya",
      };

      void request(server)
        .post("/users/1/addresses")
        .send(dto)
        .set("x-api-key", "api-key")
        .expect("Content-Type", /json/)
        .expect(201, done);
    });
    it("PUT /users/{id}", done => {
      const dto: UpdateUserDto = {
        username: "mark",
        contact: { email: "contact@mark.com" },
      };

      void request(server)
        .put("/users/1")
        .send(dto)
        .set("x-api-key", "api-key")
        .expect("Content-Type", /json/)
        .expect(200, done);
    });
    it("DELETE /users/{id}", done => {
      const res = {
        message: "User deleted",
      };

      void request(server)
        .delete("/users/1")
        .set("x-api-key", "api-key")
        .expect("Content-Type", /json/)
        .expect(200, JSON.stringify(res), done);
    });
  });

  afterAll(async() => {
    await app.close();
  });
});
