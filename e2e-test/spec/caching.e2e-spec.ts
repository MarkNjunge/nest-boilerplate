import request from "supertest";
import { testApiHost, testAdminKey, randomString } from "../util";

// Auth header factory
const auth = (): Record<string, string> => ({
  Authorization: `Bearer ${testAdminKey}`
});

/** POST /categories with admin auth, returns response body */
async function createCategory(dto?: { name?: string; parentId?: string }) {
  const payload = { name: dto?.name ?? randomString(10), ...(dto?.parentId ? { parentId: dto.parentId } : {}) };
  const res = await request(testApiHost)
    .post("/categories")
    .send(payload)
    .set(auth());
  return res.body;
}

describe("Category cache invalidation", () => {
  // ── Gen-based invalidation ──────────────────────────────────────

  describe("Gen bump — create (POST /categories)", () => {
    it("invalidates list cache", async () => {
      const name = randomString(10);

      // Warm: read with filter=name to populate list cache
      const before = await request(testApiHost)
        .get("/categories")
        .query({ filter: `(name,eq,${name})` });
      expect(before.body).toHaveLength(0);

      // Write
      await createCategory({ name });

      // Re-read: cache miss → fresh data
      const after = await request(testApiHost)
        .get("/categories")
        .query({ filter: `(name,eq,${name})` });
      expect(after.body).toHaveLength(1);
      expect(after.body[0].name).toBe(name);
    });

    it("invalidates get cache (GET /categories/first)", async () => {
      const name = randomString(10);

      // Warm: entity doesn't exist yet → 404 (null result not cached; gen bump is the real test)
      const before = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(name,eq,${name})` });
      expect(before.status).toBe(404);

      // Write
      await createCategory({ name });

      // Re-read: gen bumped → fresh read
      const after = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(name,eq,${name})` });
      expect(after.status).toBe(200);
      expect(after.body.name).toBe(name);
    });

    it("invalidates listCursor cache", async () => {
      const name = randomString(10);

      // Warm
      const before = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter: `(name,eq,${name})` });
      expect(before.body.data).toHaveLength(0);

      // Write
      await createCategory({ name });

      // Re-read
      const after = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter: `(name,eq,${name})` });
      expect(after.body.data).toHaveLength(1);
      expect(after.body.data[0].name).toBe(name);
    });
  });

  describe("Gen bump — createBulk (POST /categories/bulk)", () => {
    it("invalidates list cache", async () => {
      const names = [randomString(8), randomString(8)];
      const filter = `(name,in,${names.join("|")})`;

      // Warm
      const before = await request(testApiHost)
        .get("/categories")
        .query({ filter });
      expect(before.body).toHaveLength(0);

      // Write
      const res = await request(testApiHost)
        .post("/categories/bulk")
        .send(names.map(n => ({ name: n })))
        .set(auth());
      expect(res.body).toHaveLength(2);

      // Re-read
      const after = await request(testApiHost)
        .get("/categories")
        .query({ filter });
      expect(after.body).toHaveLength(2);
      expect(after.body.map((c: any) => c.name).sort()).toEqual(names.sort());
    });

    it("invalidates get cache (GET /categories/first)", async () => {
      const name = randomString(8);
      const otherName = randomString(8);

      // Warm: entity doesn't exist yet → 404
      const before = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(name,eq,${name})` });
      expect(before.status).toBe(404);

      // Write
      await request(testApiHost)
        .post("/categories/bulk")
        .send([{ name }, { name: otherName }])
        .set(auth());

      // Re-read: gen bumped → fresh read
      const after = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(name,eq,${name})` });
      expect(after.status).toBe(200);
      expect(after.body.name).toBe(name);
    });

    it("invalidates listCursor cache", async () => {
      const names = [randomString(8), randomString(8)];
      const filter = `(name,in,${names.join("|")})`;

      // Warm
      const before = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter });
      expect(before.body.data).toHaveLength(0);

      // Write
      await request(testApiHost)
        .post("/categories/bulk")
        .send(names.map(n => ({ name: n })))
        .set(auth());

      // Re-read
      const after = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter });
      expect(after.body.data).toHaveLength(2);
    });
  });

  describe("Gen bump — upsert (PUT /categories)", () => {
    it("invalidates list cache", async () => {
      const name = randomString(10);

      // Warm
      const before = await request(testApiHost)
        .get("/categories")
        .query({ filter: `(name,eq,${name})` });
      expect(before.body).toHaveLength(0);

      // Write
      await request(testApiHost)
        .put("/categories")
        .send({ name })
        .set(auth());

      // Re-read
      const after = await request(testApiHost)
        .get("/categories")
        .query({ filter: `(name,eq,${name})` });
      expect(after.body).toHaveLength(1);
      expect(after.body[0].name).toBe(name);
    });

    it("invalidates get cache (GET /categories/first)", async () => {
      const name = randomString(10);

      // Warm: entity doesn't exist yet → 404
      const before = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(name,eq,${name})` });
      expect(before.status).toBe(404);

      // Write
      await request(testApiHost)
        .put("/categories")
        .send({ name })
        .set(auth());

      // Re-read: gen bumped → fresh read
      const after = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(name,eq,${name})` });
      expect(after.status).toBe(200);
      expect(after.body.name).toBe(name);
    });

    it("invalidates listCursor cache", async () => {
      const name = randomString(10);

      // Warm
      const before = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter: `(name,eq,${name})` });
      expect(before.body.data).toHaveLength(0);

      // Write
      await request(testApiHost)
        .put("/categories")
        .send({ name })
        .set(auth());

      // Re-read
      const after = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter: `(name,eq,${name})` });
      expect(after.body.data).toHaveLength(1);
      expect(after.body.data[0].name).toBe(name);
    });
  });

  describe("Gen bump — upsertBulk (PUT /categories/bulk)", () => {
    it("invalidates list cache", async () => {
      const names = [randomString(8), randomString(8)];
      const filter = `(name,in,${names.join("|")})`;

      // Warm
      const before = await request(testApiHost)
        .get("/categories")
        .query({ filter });
      expect(before.body).toHaveLength(0);

      // Write
      await request(testApiHost)
        .put("/categories/bulk")
        .send(names.map(n => ({ name: n })))
        .set(auth());

      // Re-read
      const after = await request(testApiHost)
        .get("/categories")
        .query({ filter });
      expect(after.body).toHaveLength(2);
    });

    it("invalidates get cache (GET /categories/first)", async () => {
      const name = randomString(8);

      // Warm: entity doesn't exist yet → 404
      const before = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(name,eq,${name})` });
      expect(before.status).toBe(404);

      // Write
      await request(testApiHost)
        .put("/categories/bulk")
        .send([{ name }, { name: randomString(8) }])
        .set(auth());

      // Re-read: gen bumped → fresh read
      const after = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(name,eq,${name})` });
      expect(after.status).toBe(200);
      expect(after.body.name).toBe(name);
    });

    it("invalidates listCursor cache", async () => {
      const names = [randomString(8), randomString(8)];
      const filter = `(name,in,${names.join("|")})`;

      // Warm
      const before = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter });
      expect(before.body.data).toHaveLength(0);

      // Write
      await request(testApiHost)
        .put("/categories/bulk")
        .send(names.map(n => ({ name: n })))
        .set(auth());

      // Re-read
      const after = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter });
      expect(after.body.data).toHaveLength(2);
    });
  });

  describe("Gen bump — update (PATCH /categories/:id)", () => {
    let entity: any;
    let id: string;
    const oldName = randomString(10);
    const newName = randomString(10);

    beforeAll(async () => {
      entity = await createCategory({ name: oldName });
      id = entity.id;
    });

    it("invalidates list cache", async () => {
      // Warm: read by id filter
      const before = await request(testApiHost)
        .get("/categories")
        .query({ filter: `(id,eq,${id})` });
      expect(before.body[0].name).toBe(oldName);

      // Write
      await request(testApiHost)
        .patch(`/categories/${id}`)
        .send({ name: newName })
        .set(auth());

      // Re-read: should see new name (not stale oldName)
      const after = await request(testApiHost)
        .get("/categories")
        .query({ filter: `(id,eq,${id})` });
      expect(after.body[0].name).toBe(newName);
      expect(after.body[0].name).not.toBe(oldName);
    });

    it("invalidates get cache (GET /categories/first)", async () => {
      // Create entity first and warm cache by reading with id filter
      const ent = await createCategory({ name: randomString(10) });
      const entId = ent.id;

      // Warm: entity exists → 200 (cache populated)
      const before = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(id,eq,${entId})` });
      expect(before.status).toBe(200);
      expect(before.body.name).toBe(ent.name);

      // Update
      const updatedName = randomString(10);
      await request(testApiHost)
        .patch(`/categories/${entId}`)
        .send({ name: updatedName })
        .set(auth());

      // Re-read: gen bumped → fresh data
      const after = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(id,eq,${entId})` });
      expect(after.status).toBe(200);
      expect(after.body.name).toBe(updatedName);
      expect(after.body.name).not.toBe(ent.name);
    });

    it("invalidates listCursor cache", async () => {
      const ent = await createCategory({ name: randomString(8) });
      const entId = ent.id;
      const updated = randomString(8);

      // Warm
      const before = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter: `(id,eq,${entId})` });
      expect(before.body.data[0].name).toBe(ent.name);

      // Write
      await request(testApiHost)
        .patch(`/categories/${entId}`)
        .send({ name: updated })
        .set(auth());

      // Re-read
      const after = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter: `(id,eq,${entId})` });
      expect(after.body.data[0].name).toBe(updated);
    });
  });

  describe("Gen bump — updateIndexed (PATCH /categories)", () => {
    it("invalidates list cache", async () => {
      const uniqueName = `idx-upd-${randomString(8)}`;
      const updatedName = `idx-upd-new-${randomString(6)}`;

      // Create
      await createCategory({ name: uniqueName });

      // Warm: read by original name filter
      const before = await request(testApiHost)
        .get("/categories")
        .query({ filter: `(name,eq,${uniqueName})` });
      expect(before.body).toHaveLength(1);
      expect(before.body[0].name).toBe(uniqueName);

      // Write: rename via updateIndexed
      await request(testApiHost)
        .patch("/categories")
        .query({ filter: `(name,eq,${uniqueName})` })
        .send({ name: updatedName })
        .set(auth());

      // Re-read with old filter: should be empty (gen bumped → fresh DB query → no match)
      // If stale: returns entity with old name
      const after = await request(testApiHost)
        .get("/categories")
        .query({ filter: `(name,eq,${uniqueName})` });
      expect(after.body).toHaveLength(0);
    });

    it("invalidates get cache (GET /categories/first)", async () => {
      const uniqueName = `idx-get-${randomString(8)}`;
      const updatedName = `idx-get-new-${randomString(6)}`;

      await createCategory({ name: uniqueName });

      // Warm: entity exists → cache populated
      const before = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(name,eq,${uniqueName})` });
      expect(before.status).toBe(200);
      expect(before.body.name).toBe(uniqueName);

      // Write: rename via updateIndexed
      await request(testApiHost)
        .patch("/categories")
        .query({ filter: `(name,eq,${uniqueName})` })
        .send({ name: updatedName })
        .set(auth());

      // Re-read with old filter: gen bumped → fresh DB query → no match → 404
      // (stale cache would return 200 with old name)
      const after = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(name,eq,${uniqueName})` });
      expect(after.status).toBe(404);
    });

    it("invalidates listCursor cache", async () => {
      const uniqueName = `idx-cur-${randomString(8)}`;
      const updatedName = `idx-cur-new-${randomString(6)}`;

      await createCategory({ name: uniqueName });

      // Warm
      const before = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter: `(name,eq,${uniqueName})` });
      expect(before.body.data).toHaveLength(1);

      // Write
      await request(testApiHost)
        .patch("/categories")
        .query({ filter: `(name,eq,${uniqueName})` })
        .send({ name: updatedName })
        .set(auth());

      // Re-read
      const after = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter: `(name,eq,${uniqueName})` });
      expect(after.body.data).toHaveLength(0);
    });
  });

  describe("Gen bump — deleteById (DELETE /categories/:id)", () => {
    it("invalidates list cache", async () => {
      const ent = await createCategory({ name: randomString(10) });

      // Warm
      const before = await request(testApiHost)
        .get("/categories")
        .query({ filter: `(id,eq,${ent.id})` });
      expect(before.body).toHaveLength(1);

      // Write
      await request(testApiHost)
        .delete(`/categories/${ent.id}`)
        .set(auth());

      // Re-read: should be empty (gen bumped)
      const after = await request(testApiHost)
        .get("/categories")
        .query({ filter: `(id,eq,${ent.id})` });
      expect(after.body).toHaveLength(0);
    });

    it("invalidates get cache (GET /categories/first)", async () => {
      const ent = await createCategory({ name: randomString(10) });

      // Warm: entity exists → cache populated
      const before = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(id,eq,${ent.id})` });
      expect(before.status).toBe(200);
      expect(before.body.name).toBe(ent.name);

      // Write
      await request(testApiHost)
        .delete(`/categories/${ent.id}`)
        .set(auth());

      // Re-read: gen bumped → fresh DB query → no match → 404
      // (stale cache would return 200 with stale entity)
      const after = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(id,eq,${ent.id})` });
      expect(after.status).toBe(404);
    });

    it("invalidates listCursor cache", async () => {
      const ent = await createCategory({ name: randomString(10) });

      // Warm
      const before = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter: `(id,eq,${ent.id})` });
      expect(before.body.data).toHaveLength(1);

      // Write
      await request(testApiHost)
        .delete(`/categories/${ent.id}`)
        .set(auth());

      // Re-read
      const after = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter: `(id,eq,${ent.id})` });
      expect(after.body.data).toHaveLength(0);
    });
  });

  describe("Gen bump — deleteIndexed (DELETE /categories)", () => {
    it("invalidates list cache", async () => {
      const uniqueName = `del-idx-${randomString(8)}`;
      await createCategory({ name: uniqueName });

      // Warm
      const before = await request(testApiHost)
        .get("/categories")
        .query({ filter: `(name,eq,${uniqueName})` });
      expect(before.body).toHaveLength(1);

      // Write
      await request(testApiHost)
        .delete("/categories")
        .query({ filter: `(name,eq,${uniqueName})` })
        .set(auth());

      // Re-read
      const after = await request(testApiHost)
        .get("/categories")
        .query({ filter: `(name,eq,${uniqueName})` });
      expect(after.body).toHaveLength(0);
    });

    it("invalidates get cache (GET /categories/first)", async () => {
      const uniqueName = `del-idx-get-${randomString(8)}`;
      await createCategory({ name: uniqueName });

      // Warm: entity exists → cache populated
      const before = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(name,eq,${uniqueName})` });
      expect(before.status).toBe(200);
      expect(before.body.name).toBe(uniqueName);

      // Write
      await request(testApiHost)
        .delete("/categories")
        .query({ filter: `(name,eq,${uniqueName})` })
        .set(auth());

      // Re-read: gen bumped → fresh DB → no match → 404
      // (stale cache would return 200)
      const after = await request(testApiHost)
        .get("/categories/first")
        .query({ filter: `(name,eq,${uniqueName})` });
      expect(after.status).toBe(404);
    });

    it("invalidates listCursor cache", async () => {
      const uniqueName = `del-idx-cur-${randomString(8)}`;
      await createCategory({ name: uniqueName });

      // Warm
      const before = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter: `(name,eq,${uniqueName})` });
      expect(before.body.data).toHaveLength(1);

      // Write
      await request(testApiHost)
        .delete("/categories")
        .query({ filter: `(name,eq,${uniqueName})` })
        .set(auth());

      // Re-read
      const after = await request(testApiHost)
        .get("/categories/cursor")
        .query({ filter: `(name,eq,${uniqueName})` });
      expect(after.body.data).toHaveLength(0);
    });
  });

  // ── idKey invalidation ──────────────────────────────────────────

  describe("idKey invalidation — getById (GET /categories/:id)", () => {
    it("upsert: getById returns correct entity after upsert", async () => {
      const name = randomString(10);
      const res = await request(testApiHost)
        .put("/categories")
        .send({ name })
        .set(auth());

      const entityId = res.body.id;
      const getRes = await request(testApiHost)
        .get(`/categories/${entityId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.name).toBe(name);
    });

    it("upsertBulk: getById returns correct entities after upsertBulk", async () => {
      const names = [randomString(8), randomString(8)];
      const res = await request(testApiHost)
        .put("/categories/bulk")
        .send(names.map(n => ({ name: n })))
        .set(auth());
      expect(res.body).toHaveLength(2);

      for (const entity of res.body) {
        const getRes = await request(testApiHost)
          .get(`/categories/${entity.id}`);
        expect(getRes.status).toBe(200);
        expect(getRes.body.name).toBe(entity.name);
      }
    });

    it("update: getById returns updated entity (idKey deleted)", async () => {
      const ent = await createCategory({ name: randomString(10) });

      // Warm idKey cache
      const warm = await request(testApiHost)
        .get(`/categories/${ent.id}`);
      expect(warm.body.name).toBe(ent.name);

      // Update
      const newName = randomString(10);
      await request(testApiHost)
        .patch(`/categories/${ent.id}`)
        .send({ name: newName })
        .set(auth());

      // getById: must return new name (idKey was deleted → cache miss → fresh DB)
      const after = await request(testApiHost)
        .get(`/categories/${ent.id}`);
      expect(after.status).toBe(200);
      expect(after.body.name).toBe(newName);
      expect(after.body.name).not.toBe(ent.name);
    });

    it("updateIndexed: getById returns updated entity (idKey deleted)", async () => {
      const uniqueName = `idx-idkey-${randomString(8)}`;
      const ent = await createCategory({ name: uniqueName });

      // Warm idKey cache
      const warm = await request(testApiHost)
        .get(`/categories/${ent.id}`);
      expect(warm.body.name).toBe(uniqueName);

      // Update via updateIndexed
      const newName = `idx-idkey-new-${randomString(6)}`;
      const updRes = await request(testApiHost)
        .patch("/categories")
        .query({ filter: `(name,eq,${uniqueName})` })
        .send({ name: newName })
        .set(auth());
      expect(updRes.body).toHaveLength(1);

      // getById: must return new name
      const after = await request(testApiHost)
        .get(`/categories/${ent.id}`);
      expect(after.status).toBe(200);
      expect(after.body.name).toBe(newName);
    });

    it("deleteById: getById returns 404 (idKey deleted)", async () => {
      const ent = await createCategory({ name: randomString(10) });

      // Warm idKey cache
      const warm = await request(testApiHost)
        .get(`/categories/${ent.id}`);
      expect(warm.status).toBe(200);

      // Delete
      await request(testApiHost)
        .delete(`/categories/${ent.id}`)
        .set(auth());

      // getById: must 404 (idKey deleted → cache miss → DB null)
      const after = await request(testApiHost)
        .get(`/categories/${ent.id}`);
      expect(after.status).toBe(404);
    });

    it("deleteIndexed: getById returns 404 (idKey deleted)", async () => {
      const uniqueName = `del-idx-idkey-${randomString(8)}`;
      const ent = await createCategory({ name: uniqueName });

      // Warm idKey cache
      const warm = await request(testApiHost)
        .get(`/categories/${ent.id}`);
      expect(warm.status).toBe(200);
      expect(warm.body.name).toBe(uniqueName);

      // Delete via deleteIndexed
      await request(testApiHost)
        .delete("/categories")
        .query({ filter: `(name,eq,${uniqueName})` })
        .set(auth());

      // getById: must 404
      const after = await request(testApiHost)
        .get(`/categories/${ent.id}`);
      expect(after.status).toBe(404);
    });
  });
});
