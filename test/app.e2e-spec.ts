import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";
import { INestApplication, HttpServer } from "@nestjs/common";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe } from "../src/common/pipes/validation.pipe";
import { CreateUserDto } from "src/users/dto/CreateUser.dto";
import { CreateAddressDto } from "../src/users/dto/CreateAddress.dto";
import { UpdateUserDto } from "../src/users/dto/UpdateUser.dto";
import * as winston from "winston";
import { BlankTransport } from "./util/Blank.transport";

describe("AppController (e2e)", () => {
  let app: INestApplication;
  let server: HttpServer;

  beforeAll(async () => {
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
    await app.getHttpAdapter().getInstance().ready();

    server = app.getHttpServer();
  });

  describe("/", () => {
    it("GET /", () => {
      return request(server).get("/").expect(200).expect("Hello World!");
    });
  });

  describe("/users", () => {
    it("GET /users", (done) => {
      return request(server)
        .get("/users")
        .expect("Content-Type", /json/)
        .expect(200, done);
    });
    it("POST /users", (done) => {
      const dto: CreateUserDto = {
        username: "mark",
        contact: { email: "mark@mail.com" },
      };
      return request(server)
        .post("/users")
        .send(dto)
        .set("x-api-key", "api-key")
        .expect("Content-Type", /json/)
        .expect(201, done);
    });
    it("POST /users/{id}/addresses", (done) => {
      const dto: CreateAddressDto = {
        city: "Nairobi",
        country: "Kenya",
      };

      return request(server)
        .post("/users/1/addresses")
        .send(dto)
        .set("x-api-key", "api-key")
        .expect("Content-Type", /json/)
        .expect(201, done);
    });
    it("PUT /users/{id}", (done) => {
      const dto: UpdateUserDto = {
        username: "mark",
        contact: { email: "contact@mark.com" },
      };
      return request(server)
        .put("/users/1")
        .send(dto)
        .set("x-api-key", "api-key")
        .expect("Content-Type", /json/)
        .expect(200, done);
    });
    it("DELETE /users/{id}", (done) => {
      const res = {
        message: "User deleted",
      };
      return request(server)
        .delete("/users/1")
        .set("x-api-key", "api-key")
        .expect("Content-Type", /json/)
        .expect(200, JSON.stringify(res), done);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
