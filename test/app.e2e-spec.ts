/* eslint-disable max-lines-per-function */
import * as request from "supertest";
import { CreateAddressDto } from "../src/models/address";

describe("App e2e", () => {
  const host = process.env.HOST ?? "http://localhost:3000";

  describe("/", () => {
    it("GET /", done => {
      void request(host)
        .get("/")
        .expect(200, done);
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
      const dto = {
        username: "mark",
        contact: { email: "mark@mail.com" },
      };

      void request(host)
        .post("/users")
        .send(dto)
        .set("Authorization", "Bearer api-key")
        .expect("Content-Type", /json/)
        .expect(201, done);
    });
    it("POST /users/_bulk", done => {
      const dto = [
        {
          username: "mark",
          contact: { email: "mark@mail.com" },
        },
      ];

      void request(host)
        .post("/users/_bulk")
        .send(dto)
        .set("Authorization", "Bearer api-key")
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
        .set("Authorization", "Bearer api-key")
        .expect("Content-Type", /json/)
        .expect(201, done);
    });
    it("PUT /users/{id}", done => {
      const dto = {
        username: "mark",
        contact: { email: "contact@mark.com" },
      };

      void request(host)
        .put("/users/1")
        .send(dto)
        .set("Authorization", "Bearer api-key")
        .expect("Content-Type", /json/)
        .expect(200, done);
    });
    it("DELETE /users/{id}", done => {
      const res = {
        message: "User deleted",
      };

      void request(host)
        .delete("/users/1")
        .set("Authorization", "Bearer api-key")
        .expect("Content-Type", /json/)
        .expect(200, JSON.stringify(res), done);
    });
  });
});
