import request from "supertest";
import { testApiHost, randomString } from "../util";

describe("Pagination", () => {
  it("GET /users/cursor returns paginated results with pageInfo", async () => {
    const response = await request(testApiHost)
      .get("/users/cursor")
      .query({ limit: "5" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("pageInfo");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.pageInfo).toHaveProperty("hasNextPage");
    expect(response.body.pageInfo).toHaveProperty("hasPreviousPage");
    expect(response.body.pageInfo).toHaveProperty("startCursor");
    expect(response.body.pageInfo).toHaveProperty("endCursor");
  });

  it("GET /users/cursor with after parameter paginates forward", async () => {
    // Create users to ensure we have data
    for (let i = 0; i < 3; i++) {
      await request(testApiHost)
        .post("/users")
        .send({
          username: `cursor_user_${randomString(4)}`,
          email: `cursor_${randomString(6)}@mail.com`,
          profile: { bio: "test" }
        })
        .set("Authorization", "Bearer api-key");
    }

    const firstPage = await request(testApiHost)
      .get("/users/cursor")
      .query({ limit: "1" });

    expect(firstPage.status).toBe(200);

    if (firstPage.body.pageInfo.hasNextPage) {
      const secondPage = await request(testApiHost)
        .get("/users/cursor")
        .query({ limit: "1", after: firstPage.body.pageInfo.endCursor });

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data[0].id).not.toBe(firstPage.body.data[0].id);
      expect(secondPage.body.pageInfo.hasPreviousPage).toBe(true);
    }
  });

  it("GET /users/cursor with before parameter paginates backward", async () => {
    // Create users to ensure we have data
    for (let i = 0; i < 3; i++) {
      await request(testApiHost)
        .post("/users")
        .send({
          username: `cursor_back_${randomString(4)}`,
          email: `cursor_back_${randomString(6)}@mail.com`,
          profile: { bio: "test" }
        })
        .set("Authorization", "Bearer api-key");
    }

    const firstPage = await request(testApiHost)
      .get("/users/cursor")
      .query({ limit: "1" });

    if (firstPage.body.pageInfo.hasNextPage) {
      const secondPage = await request(testApiHost)
        .get("/users/cursor")
        .query({ limit: "1", after: firstPage.body.pageInfo.endCursor });

      const previousPage = await request(testApiHost)
        .get("/users/cursor")
        .query({ limit: "1", before: secondPage.body.pageInfo.startCursor });

      expect(previousPage.status).toBe(200);
      expect(previousPage.body.data[0].id).toBe(firstPage.body.data[0].id);
    }
  });

  it("GET /users/cursor rejects both after and before", async () => {
    const response = await request(testApiHost)
      .get("/users/cursor")
      .query({ after: "cursor1", before: "cursor2" });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Cannot use both");
  });

  it("GET /users/cursor works with filters", async () => {
    const uniqueEmail = `filter_cursor_${randomString(8)}@test.com`;
    await request(testApiHost)
      .post("/users")
      .send({
        username: `filter_cursor_${randomString(4)}`,
        email: uniqueEmail,
        profile: { bio: "test" }
      })
      .set("Authorization", "Bearer api-key");

    const response = await request(testApiHost)
      .get("/users/cursor")
      .query({ filter: `(email,eq,${uniqueEmail})`, limit: "10" });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].email).toBe(uniqueEmail);
  });
});
