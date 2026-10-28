import { describe, it } from "vitest";
import request from "supertest";
import { testApiHost } from "../util";

describe("App e2e", () => {
  describe("/", () => {
    it("GET /", async () => {
      await request(testApiHost).get("/").expect(200);
    });
  });
});
