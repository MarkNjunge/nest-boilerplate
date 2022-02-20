/* eslint-disable max-lines-per-function */
import * as request from "supertest";
import { CreateUserDto } from "src/modules/users/dto/CreateUser.dto";
import { CreateAddressDto } from "../src/modules/users/dto/CreateAddress.dto";
import { UpdateUserDto } from "../src/modules/users/dto/UpdateUser.dto";

describe("App e2e", () => {
  const host = process.env.HOST ?? "http://localhost:3000";

  describe("/", () => {
    it("GET /", done => {
      void request(host)
        .get("/")
        .expect(200)
        .expect("Hello World!", done);
    });
  });

  describe("/users", () => {
    it("GET /users", done => {
      void request(host)
        .get("/users")
        .expect("Content-Type", /json/)
        .expect(200, done);
    });
    it("POST /users", done => {
      const dto: CreateUserDto = {
        username: "mark",
        contact: { email: "mark@mail.com" },
      };

      void request(host)
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

      void request(host)
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

      void request(host)
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

      void request(host)
        .delete("/users/1")
        .set("x-api-key", "api-key")
        .expect("Content-Type", /json/)
        .expect(200, JSON.stringify(res), done);
    });
  });
});
