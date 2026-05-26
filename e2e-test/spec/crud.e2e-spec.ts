import request from "supertest";
import { testApiHost, randomString } from "../util";

describe("CRUD", () => {
  let userId: string;

  beforeAll(async () => {
    const userDto = {
      username: randomString(6),
      email: `${randomString(6)}@mail.com`,
      profile: { bio: "crud-test" }
    };
    const res = await request(testApiHost)
      .post("/users")
      .send(userDto)
      .set("Authorization", "Bearer api-key");
    userId = res.body.id;
  });

  it("GET /posts/count", async () => {
    const response = await request(testApiHost)
      .get("/posts/count")
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(typeof response.body).toBe("number");
  });

  it("GET /posts/count with filter", async () => {
    const createDto = {
      title: randomString(6),
      content: `${randomString(6)} content`
    };
    await request(testApiHost)
      .post("/posts")
      .send(createDto)
      .set("Authorization", `Bearer ${userId}`);

    const response = await request(testApiHost)
      .get("/posts/count")
      .query({ filter: `(title,eq,${createDto.title})` })
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(typeof response.body).toBe("number");
  });

  it("GET /posts", async () => {
    const response = await request(testApiHost)
      .get("/posts")
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("GET /posts with query parameters", async () => {
    const response = await request(testApiHost)
      .get("/posts")
      .query({
        select: "title,content",
        filter: "(title,eq,nonexistent)",
        limit: "10",
        offset: "0",
        sort: "(title,ASC)"
      })
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty("title");
      expect(response.body[0]).toHaveProperty("content");
    }
  });

  it("GET /posts/first", async () => {
    const createDto = {
      title: randomString(6),
      content: `${randomString(6)} content`
    };
    await request(testApiHost)
      .post("/posts")
      .send(createDto)
      .set("Authorization", `Bearer ${userId}`);

    const response = await request(testApiHost)
      .get("/posts/first")
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
  });

  it("GET /posts/first with filter", async () => {
    const createDto = {
      title: randomString(6),
      content: `${randomString(6)} content`
    };
    await request(testApiHost)
      .post("/posts")
      .send(createDto)
      .set("Authorization", `Bearer ${userId}`);

    const response = await request(testApiHost)
      .get("/posts/first")
      .query({ filter: `(title,eq,${createDto.title})` })
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    if (response.body) {
      expect(response.body.title).toBe(createDto.title);
    }
  });

  it("GET /posts/:id", async () => {
    const createDto = {
      title: randomString(6),
      content: `${randomString(6)} content`
    };
    const createResult = await request(testApiHost)
      .post("/posts")
      .send(createDto)
      .set("Authorization", `Bearer ${userId}`);

    const response = await request(testApiHost)
      .get(`/posts/${createResult.body.id}`)
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body.id).toBe(createResult.body.id);
    expect(response.body.title).toBe(createDto.title);
    expect(response.body.content).toBe(createDto.content);
  });

  it("GET /posts/:id with select", async () => {
    const createDto = {
      title: randomString(6),
      content: `${randomString(6)} content`
    };
    const createResult = await request(testApiHost)
      .post("/posts")
      .send(createDto)
      .set("Authorization", `Bearer ${userId}`);

    const response = await request(testApiHost)
      .get(`/posts/${createResult.body.id}`)
      .query({ select: "title,content" })
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toHaveProperty("title");
    expect(response.body).toHaveProperty("content");
  });

  it("POST /posts", async () => {
    const createDto = {
      title: randomString(6),
      content: `${randomString(6)} content`
    };
    const response = await request(testApiHost)
      .post("/posts")
      .send(createDto)
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(201);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe(createDto.title);
    expect(response.body.content).toBe(createDto.content);
  });

  it("POST /posts will validate", async () => {
    const createDto = {};
    const response = await request(testApiHost)
      .post("/posts")
      .send(createDto)
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(400);
    expect(response.headers["content-type"]).toMatch(/json/);
  });

  it("POST /posts without auth should fail", async () => {
    const createDto = {
      title: randomString(6),
      content: `${randomString(6)} content`
    };
    const response = await request(testApiHost)
      .post("/posts")
      .send(createDto);

    expect(response.status).toBe(401);
  });

  it("POST /posts/bulk", async () => {
    const createDto = [
      {
        title: randomString(6),
        content: `${randomString(6)} content`
      },
      {
        title: randomString(6),
        content: `${randomString(6)} content`
      }
    ];
    const response = await request(testApiHost)
      .post("/posts/bulk")
      .send(createDto)
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(201);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toHaveProperty("id");
    expect(response.body[0].title).toBe(createDto[0].title);
    expect(response.body[1].title).toBe(createDto[1].title);
  });

  it("PUT /posts (upsert)", async () => {
    const createDto = {
      title: randomString(6),
      content: `${randomString(6)} content`
    };
    const response = await request(testApiHost)
      .put("/posts")
      .send(createDto)
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe(createDto.title);
    expect(response.body.content).toBe(createDto.content);
  });

  it("PUT /posts/bulk (upsert bulk)", async () => {
    const createDto = [
      {
        title: randomString(6),
        content: `${randomString(6)} content`
      },
      {
        title: randomString(6),
        content: `${randomString(6)} content`
      }
    ];
    const response = await request(testApiHost)
      .put("/posts/bulk")
      .send(createDto)
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].title).toBe(createDto[0].title);
    expect(response.body[1].title).toBe(createDto[1].title);
  });

  it("PATCH /posts/:id", async () => {
    const createDto = {
      title: randomString(6),
      content: `${randomString(6)} content`
    };
    const createResult = await request(testApiHost)
      .post("/posts")
      .send(createDto)
      .set("Authorization", `Bearer ${userId}`);

    const updateDto = { title: "updated title" };
    const response = await request(testApiHost)
      .patch(`/posts/${createResult.body.id}`)
      .send(updateDto)
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body.id).toBe(createResult.body.id);
    expect(response.body.content).toBe(createDto.content);
    expect(response.body.title).toBe(updateDto.title);
  });

  it("PATCH /posts (updateIndexed)", async () => {
    const createDto = {
      title: randomString(6),
      content: `${randomString(6)} content`
    };
    await request(testApiHost)
      .post("/posts")
      .send(createDto)
      .set("Authorization", `Bearer ${userId}`);

    const updateDto = { content: "bulk updated content" };
    const response = await request(testApiHost)
      .patch("/posts")
      .query({ filter: `(title,eq,${createDto.title})` })
      .send(updateDto)
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0].content).toBe(updateDto.content);
      expect(response.body[0].title).toBe(createDto.title);
    }
  });

  it("PATCH /posts without filter should fail", async () => {
    const response = await request(testApiHost)
      .patch("/posts")
      .send({ content: "bulk updated content" })
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(400);
  });

  it("DELETE /posts/:id", async () => {
    const createDto = {
      title: randomString(6),
      content: `${randomString(6)} content`
    };
    const createResult = await request(testApiHost)
      .post("/posts")
      .send(createDto)
      .set("Authorization", `Bearer ${userId}`);

    const response = await request(testApiHost)
      .delete(`/posts/${createResult.body.id}`)
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ affected: 1 });
  });

  it("DELETE /posts (deleteIndexed)", async () => {
    const uniqueTitle = `todelete_${randomString(6)}`;
    await request(testApiHost)
      .post("/posts")
      .send({ title: uniqueTitle, content: "to delete content" })
      .set("Authorization", `Bearer ${userId}`);

    const response = await request(testApiHost)
      .delete("/posts")
      .query({ filter: `(title,eq,${uniqueTitle})` })
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ affected: 1 });
  });

  it("DELETE /posts without filter should fail", async () => {
    const response = await request(testApiHost)
      .delete("/posts")
      .set("Authorization", `Bearer ${userId}`);

    expect(response.status).toBe(400);
  });

  it("DELETE /posts without auth should fail", async () => {
    const response = await request(testApiHost)
      .delete("/posts")
      .query({ filter: "(title,eq,todelete)" });

    expect(response.status).toBe(401);
  });
});
