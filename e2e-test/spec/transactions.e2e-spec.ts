import request from "supertest";
import { testApiHost, randomString } from "../util";

describe("Transactions", () => {
  let userId: string;

  beforeAll(async () => {
    const userDto = {
      username: randomString(6),
      email: `${randomString(6)}@mail.com`,
      profile: { bio: "tx-test" }
    };
    const res = await request(testApiHost)
      .post("/users")
      .send(userDto)
      .set("Authorization", "Bearer api-key");
    userId = res.body.id;
  });

  it("POST /post/with-comment creates post and comment atomically", async () => {
    const dto = {
      title: `TX Post ${randomString(6)}`,
      content: "Transaction test content",
      userId,
      comment: { content: "First comment via transaction" }
    };

    const response = await request(testApiHost)
      .post("/post/with-comment")
      .send(dto)
      .set("Authorization", "Bearer api-key");

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe(dto.title);
    expect(response.body.content).toBe(dto.content);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body.comments[0].content).toBe(dto.comment.content);
    expect(response.body.comments[0].postId).toBe(response.body.id);

    // Verify both entities persisted
    const postRes = await request(testApiHost)
      .get(`/post/${response.body.id}`)
      .query({ include: "comments" });
    expect(postRes.status).toBe(200);
    expect(postRes.body.comments).toHaveLength(1);
  });

  it("POST /post/with-comment rolls back when categoryId is invalid", async () => {
    const uniqueTitle = `Rollback ${randomString(10)}`;
    const dto = {
      title: uniqueTitle,
      content: "Should be rolled back",
      userId,
      categoryId: "invalid_category_id",
      comment: { content: "Should not exist" }
    };

    const response = await request(testApiHost)
      .post("/post/with-comment")
      .send(dto)
      .set("Authorization", "Bearer api-key");

    expect(response.status).toBe(500);

    // Verify the post was NOT created (transaction rolled back)
    const postRes = await request(testApiHost)
      .get("/post")
      .query({ filter: `(title,eq,${uniqueTitle})` });

    expect(postRes.status).toBe(200);
    expect(postRes.body).toHaveLength(0);
  });
});

