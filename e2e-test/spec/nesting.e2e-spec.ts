import request from "supertest";
import { testApiHost, randomString } from "../util";

describe("Nesting", () => {
  it("GET /users with select and include", async () => {
    const createDto = {
      username: randomString(6),
      email: `${randomString(6)}@mail.com`,
      profile: { bio: "lorem" }
    };
    await request(testApiHost)
      .post("/users")
      .send(createDto)
      .set("Authorization", "Bearer api-key");

    const response = await request(testApiHost)
      .get("/users")
      .query({
        select: "username,profile.bio",
        include: "profile",
        filter: `(email,eq,${createDto.email})`
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].username).toBe(createDto.username);
    expect(response.body[0].profile).toBeDefined();
    expect(response.body[0].profile.bio).toBe("lorem");
    expect(response.body[0]).not.toHaveProperty("email");
    expect(response.body[0]).not.toHaveProperty("createdAt");
  });

  it("GET /post with nested select and include (comments.user)", async () => {
    // Create a user
    const userDto = {
      username: randomString(6),
      email: `${randomString(6)}@mail.com`,
      profile: { bio: "author" }
    };
    const userRes = await request(testApiHost)
      .post("/users")
      .send(userDto)
      .set("Authorization", "Bearer api-key");
    const userId = userRes.body.id;

    // Create a post
    const postDto = {
      title: `Post ${randomString(6)}`,
      content: "Full post content here",
      userId
    };
    const postRes = await request(testApiHost)
      .post("/post")
      .send(postDto)
      .set("Authorization", "Bearer api-key");
    const postId = postRes.body.id;

    // Create a comment on the post
    const commentDto = {
      content: "Great post!",
      userId,
      postId
    };
    await request(testApiHost)
      .post("/comment")
      .send(commentDto)
      .set("Authorization", "Bearer api-key");

    // Query with deep nested select: post.title, post.content, comments.content, comments.user.username
    const response = await request(testApiHost)
      .get("/post")
      .query({
        select: "title,content,comments.content,comments.user.username",
        include: "comments,comments.user",
        filter: `(id,eq,${postId})`
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    const post = response.body[0];

    // Selected fields should be present
    expect(post.title).toBe(postDto.title);
    expect(post.content).toBe(postDto.content);

    // Non-selected top-level fields should be absent
    expect(post).not.toHaveProperty("userId");
    expect(post).not.toHaveProperty("createdAt");
    expect(post).not.toHaveProperty("updatedAt");

    // Comments relation should be loaded with selected fields
    expect(post.comments).toBeDefined();
    expect(post.comments).toHaveLength(1);
    expect(post.comments[0].content).toBe("Great post!");

    // Non-selected comment fields should be absent
    expect(post.comments[0]).not.toHaveProperty("postId");
    expect(post.comments[0]).not.toHaveProperty("createdAt");

    // Nested user on comment should be loaded with only username
    expect(post.comments[0].user).toBeDefined();
    expect(post.comments[0].user.username).toBe(userDto.username);

    // Non-selected user fields should be absent
    expect(post.comments[0].user).not.toHaveProperty("email");
    expect(post.comments[0].user).not.toHaveProperty("createdAt");
  });

  it("GET /post selecting only relation fields (id,comments.id,comments.user.username)", async () => {
    // Create a user
    const userDto = {
      username: randomString(6),
      email: `${randomString(6)}@mail.com`,
      profile: { bio: "author" }
    };
    const userRes = await request(testApiHost)
      .post("/users")
      .send(userDto)
      .set("Authorization", "Bearer api-key");
    const userId = userRes.body.id;

    // Create a post
    const postDto = {
      title: `Post ${randomString(6)}`,
      content: "Post content",
      userId
    };
    const postRes = await request(testApiHost)
      .post("/post")
      .send(postDto)
      .set("Authorization", "Bearer api-key");
    const postId = postRes.body.id;

    // Create a comment on the post
    const commentDto = {
      content: "Nice post!",
      userId,
      postId
    };
    await request(testApiHost)
      .post("/comment")
      .send(commentDto)
      .set("Authorization", "Bearer api-key");

    // Query selecting only relation fields: root id, comments.id, comments.user.username
    const response = await request(testApiHost)
      .get("/post")
      .query({
        select: "id,comments.id,comments.user.username",
        include: "comments,comments.user",
        filter: `(id,eq,${postId})`
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    const post = response.body[0];

    // Only id should be present at the root level
    expect(post.id).toBe(postId);
    expect(post).not.toHaveProperty("title");
    expect(post).not.toHaveProperty("content");
    expect(post).not.toHaveProperty("userId");
    expect(post).not.toHaveProperty("createdAt");

    // Comment id should be present, other fields absent
    expect(post.comments).toHaveLength(1);
    expect(post.comments[0].id).toBeDefined();
    expect(post.comments[0]).not.toHaveProperty("content");
    expect(post.comments[0]).not.toHaveProperty("postId");
    expect(post.comments[0]).not.toHaveProperty("createdAt");

    // Only username should be present on the nested user
    expect(post.comments[0].user.username).toBe(userDto.username);
    expect(post.comments[0].user).not.toHaveProperty("email");
    expect(post.comments[0].user).not.toHaveProperty("createdAt");
  });
});
