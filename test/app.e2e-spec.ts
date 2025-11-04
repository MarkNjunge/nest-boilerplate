import * as request from "supertest";

function randomString(length: number) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

describe("App e2e", () => {
  const host = process.env.HOST ?? "http://localhost:3000";

  describe("/", () => {
    it("GET /", done => {
      void request(host).get("/").expect(200, done);
    });
  });

  describe("/users", () => {
    it("GET /users/count", async () => {
      const response = await request(host)
        .get("/users/count");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
      expect(typeof response.body).toBe("number");
    });

    it("GET /users/count with filter", async () => {
      const createDto = {
        username: randomString(6),
        email: `${randomString(6)}@mail.com`,
        profile: { bio: "lorem" }
      };
      await request(host)
        .post("/users")
        .send(createDto)
        .set("Authorization", "Bearer api-key");

      const response = await request(host)
        .get("/users/count")
        .query({ filter: `(email,eq,${createDto.email})` });

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
      expect(typeof response.body).toBe("number");
    });

    it("GET /users", async () => {
      const response = await request(host)
        .get("/users");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("GET /users with query parameters", async () => {
      const response = await request(host)
        .get("/users")
        .query({
          select: "username,email",
          filter: "(username,eq,mark)",
          limit: "10",
          offset: "0",
          sort: "(username,ASC)"
        });

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty("username");
        expect(response.body[0]).toHaveProperty("email");
      }
    });

    it("GET /users/first", async () => {
      const response = await request(host)
        .get("/users/first");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("GET /users/first with filter", async () => {
      const createDto = {
        username: randomString(6),
        email: `${randomString(6)}@mail.com`,
        profile: { bio: "lorem" }
      };
      await request(host)
        .post("/users")
        .send(createDto)
        .set("Authorization", "Bearer api-key");

      const response = await request(host)
        .get("/users/first")
        .query({ filter: `(email,eq,${createDto.email})` });

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
      if (response.body) {
        expect(response.body.email).toBe(createDto.email);
      }
    });

    it("GET /users/:id", async () => {
      const createDto = {
        username: randomString(6),
        email: `${randomString(6)}@mail.com`,
        profile: { bio: "lorem" }
      };
      const createResult = await request(host)
        .post("/users")
        .send(createDto)
        .set("Authorization", "Bearer api-key");

      const response = await request(host)
        .get(`/users/${createResult.body.id}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
      expect(response.body.id).toBe(createResult.body.id);
      expect(response.body.username).toBe(createDto.username);
      expect(response.body.email).toBe(createDto.email);
    });

    it("GET /users/:id with select", async () => {
      const createDto = {
        username: randomString(6),
        email: `${randomString(6)}@mail.com`,
        profile: { bio: "lorem" }
      };
      const createResult = await request(host)
        .post("/users")
        .send(createDto)
        .set("Authorization", "Bearer api-key");

      const response = await request(host)
        .get(`/users/${createResult.body.id}`)
        .query({ select: "username,email" });

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
      expect(response.body).toHaveProperty("username");
      expect(response.body).toHaveProperty("email");
    });

    it("POST /users", async () => {
      const createDto = {
        username: randomString(6),
        email: `${randomString(6)}@mail.com`,
        profile: { bio: "lorem" }
      };
      const response = await request(host)
        .post("/users")
        .send(createDto)
        .set("Authorization", "Bearer api-key");

      expect(response.status).toBe(201);
      expect(response.headers["content-type"]).toMatch(/json/);
      expect(response.body).toHaveProperty("id");
      expect(response.body.username).toBe(createDto.username);
      expect(response.body.email).toBe(createDto.email);
    });

    it("POST /users will validate", async () => {
      const createDto = {};
      const response = await request(host)
        .post("/users")
        .send(createDto)
        .set("Authorization", "Bearer api-key");

      expect(response.status).toBe(400);
      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("POST /users without auth should fail", async () => {
      const createDto = {
        username: randomString(6),
        email: `${randomString(6)}@mail.com`,
        profile: { bio: "lorem" }
      };
      const response = await request(host)
        .post("/users")
        .send(createDto);

      expect(response.status).toBe(401);
    });

    it("POST /users/bulk", async () => {
      const createDto = [
        {
          username: randomString(6),
          email: `${randomString(6)}@mail.com`,
          profile: { bio: "lorem" }
        },
        {
          username: randomString(6),
          email: `${randomString(6)}@mail.com`,
          profile: { bio: "lorem" }
        }
      ];
      const response = await request(host)
        .post("/users/bulk")
        .send(createDto)
        .set("Authorization", "Bearer api-key");

      expect(response.status).toBe(201);
      expect(response.headers["content-type"]).toMatch(/json/);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0].username).toBe(createDto[0].username);
      expect(response.body[1].username).toBe(createDto[1].username);
    });

    it("PUT /users (upsert)", async () => {
      const createDto = {
        username: randomString(6),
        email: `${randomString(6)}@mail.com`,
        profile: { bio: "lorem" }
      };
      const response = await request(host)
        .put("/users")
        .send(createDto)
        .set("Authorization", "Bearer api-key");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
      expect(response.body).toHaveProperty("id");
      expect(response.body.username).toBe(createDto.username);
      expect(response.body.email).toBe(createDto.email);
    });

    it("PUT /users/bulk (upsert bulk)", async () => {
      const createDto = [
        {
          username: randomString(6),
          email: `${randomString(6)}@mail.com`,
          profile: { bio: "lorem" }
        },
        {
          username: randomString(6),
          email: `${randomString(6)}@mail.com`,
          profile: { bio: "lorem" }
        }
      ];
      const response = await request(host)
        .put("/users/bulk")
        .send(createDto)
        .set("Authorization", "Bearer api-key");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].username).toBe(createDto[0].username);
      expect(response.body[1].username).toBe(createDto[1].username);
    });

    it("PATCH /users/:id", async () => {
      const createDto = {
        username: randomString(6),
        email: `${randomString(6)}@mail.com`,
        profile: { bio: "lorem" }
      };
      const createResult = await request(host)
        .post("/users")
        .send(createDto)
        .set("Authorization", "Bearer api-key");

      const updateDto = {
        email: "updated@mail.com"
      };
      const response = await request(host)
        .patch(`/users/${createResult.body.id}`)
        .send(updateDto)
        .set("Authorization", "Bearer api-key");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
      expect(response.body.id).toBe(createResult.body.id);
      expect(response.body.username).toBe(createDto.username);
      expect(response.body.email).toBe(updateDto.email);
    });

    it("PATCH /users (updateIndexed)", async () => {
      const createDto = {
        username: randomString(6),
        email: `${randomString(6)}@mail.com`,
        profile: { bio: "lorem" }
      };
      await request(host)
        .post("/users")
        .send(createDto)
        .set("Authorization", "Bearer api-key");

      const updateDto = {
        email: "bulk.updated@mail.com"
      };
      const response = await request(host)
        .patch("/users")
        .query({ filter: "(username,eq,mark)" })
        .send(updateDto)
        .set("Authorization", "Bearer api-key");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0].email).toBe(updateDto.email);
        expect(response.body[0].username).toBe("mark");
      }
    });

    it("PATCH /users without filter should fail", async () => {
      const dto = {
        email: "bulk.updated@mail.com"
      };
      const response = await request(host)
        .patch("/users")
        .send(dto)
        .set("Authorization", "Bearer api-key");

      expect(response.status).toBe(400);
    });

    it("DELETE /users/:id", async () => {
      const createDto = {
        username: randomString(6),
        email: `${randomString(6)}@mail.com`,
        profile: { bio: "lorem" }
      };
      const createResult = await request(host)
        .post("/users")
        .send(createDto)
        .set("Authorization", "Bearer api-key");

      const response = await request(host)
        .delete(`/users/${createResult.body.id}`)
        .set("Authorization", "Bearer api-key");

      expect(response.status).toBe(204);
    });

    it("DELETE /users (deleteIndexed)", async () => {
      const createDto = {
        username: "todelete",
        email: "delete@mail.com",
        profile: { bio: "lorem" }
      };
      await request(host)
        .post("/users")
        .send(createDto)
        .set("Authorization", "Bearer api-key");

      const response = await request(host)
        .delete("/users")
        .query({ filter: "(email,eq,delete@mail.com)" })
        .set("Authorization", "Bearer api-key");

      expect(response.status).toBe(204);
    });

    it("DELETE /users without filter should fail", async () => {
      const response = await request(host)
        .delete("/users")
        .set("Authorization", "Bearer api-key");

      expect(response.status).toBe(400);
    });

    it("DELETE /users without auth should fail", async () => {
      const response = await request(host)
        .delete("/users")
        .query({ filter: "(email,eq,delete@mail.com)" });

      expect(response.status).toBe(401);
    });
  });
});
