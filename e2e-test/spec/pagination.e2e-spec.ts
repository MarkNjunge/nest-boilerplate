import request from "supertest";
import { testApiHost, randomString, testAdminKey } from "../util";

describe("Pagination", () => {
  let userId: string;

  beforeAll(async () => {
    const userDto = {
      username: randomString(6),
      email: `${randomString(6)}@mail.com`,
      profile: { bio: "pagination-test" }
    };
    const res = await request(testApiHost)
      .post("/users")
      .send(userDto)
      .set("Authorization", `Bearer ${testAdminKey}`);
    userId = res.body.id;
  });

  it("GET /posts/cursor returns paginated results with pageInfo", async () => {
    await request(testApiHost)
      .post("/posts")
      .send({ title: randomString(6), content: `${randomString(6)} content` })
      .set("Authorization", `Bearer ${userId}`);

    const response = await request(testApiHost)
      .get("/posts/cursor")
      .query({ limit: "5" })
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("pageInfo");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.pageInfo).toHaveProperty("hasNextPage");
    expect(response.body.pageInfo).toHaveProperty("hasPreviousPage");
    expect(response.body.pageInfo).toHaveProperty("startCursor");
    expect(response.body.pageInfo).toHaveProperty("endCursor");
  });

  it("GET /posts/cursor with after parameter paginates forward", async () => {
    // Create posts to ensure we have data
    for (let i = 0; i < 3; i++) {
      await request(testApiHost)
        .post("/posts")
        .send({
          title: `cursor_post_${randomString(4)}`,
          content: `cursor content ${randomString(6)}`
        })
        .set("Authorization", `Bearer ${userId}`);
    }

    const firstPage = await request(testApiHost)
      .get("/posts/cursor")
      .query({ limit: "1" })
      .set("Authorization", `Bearer ${userId}`);

    expect(firstPage.status).toBe(200);

    if (firstPage.body.pageInfo.hasNextPage) {
      const secondPage = await request(testApiHost)
        .get("/posts/cursor")
        .query({ limit: "1", after: firstPage.body.pageInfo.endCursor })
        .set("Authorization", `Bearer ${userId}`);

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data[0].id).not.toBe(firstPage.body.data[0].id);
      expect(secondPage.body.pageInfo.hasPreviousPage).toBe(true);
    }
  });

  it("GET /posts/cursor with before parameter paginates backward", async () => {
    // Create posts to ensure we have data
    for (let i = 0; i < 3; i++) {
      await request(testApiHost)
        .post("/posts")
        .send({
          title: `cursor_back_${randomString(4)}`,
          content: `cursor back content ${randomString(6)}`
        })
        .set("Authorization", `Bearer ${userId}`);
    }

    const firstPage = await request(testApiHost)
      .get("/posts/cursor")
      .query({ limit: "1" })
      .set("Authorization", `Bearer ${userId}`);

    if (firstPage.body.pageInfo.hasNextPage) {
      const secondPage = await request(testApiHost)
        .get("/posts/cursor")
        .query({ limit: "1", after: firstPage.body.pageInfo.endCursor })
        .set("Authorization", `Bearer ${userId}`);

      const previousPage = await request(testApiHost)
        .get("/posts/cursor")
        .query({ limit: "1", before: secondPage.body.pageInfo.startCursor })
        .set("Authorization", `Bearer ${userId}`);

      expect(previousPage.status).toBe(200);
      expect(previousPage.body.data[0].id).toBe(firstPage.body.data[0].id);
    }
  });

  it("GET /posts/cursor rejects both after and before", async () => {
    const response = await request(testApiHost)
      .get("/posts/cursor")
      .query({ after: "cursor1", before: "cursor2" })
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Cannot use both");
  });

  it("GET /posts/cursor works with filters", async () => {
    const uniqueTitle = `filter_cursor_${randomString(8)}`;
    await request(testApiHost)
      .post("/posts")
      .send({
        title: uniqueTitle,
        content: `filter cursor content ${randomString(6)}`
      })
      .set("Authorization", `Bearer ${userId}`);

    const response = await request(testApiHost)
      .get("/posts/cursor")
      .query({ filter: `(title,eq,${uniqueTitle})`, limit: "10" })
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe(uniqueTitle);
  });
});
