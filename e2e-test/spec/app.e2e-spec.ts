import request from "supertest";
import { testApiHost } from "../util";

describe("App e2e", () => {
  describe("/", () => {
    it("GET /", done => {
      void request(testApiHost).get("/").expect(200, done);
    });
  });
});
