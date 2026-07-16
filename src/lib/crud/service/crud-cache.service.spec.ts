import { DataSource, Repository } from "typeorm";
import { CrudCacheService } from "@/lib/crud/service/crud-cache.service";
import { ICrudContext } from "@/lib/crud";
import { UserTestEntity, UserTestCreateDto } from "@/lib/crud/testing/test-entities/user-test.entity";
import { UserProfileTestEntity } from "@/lib/crud/testing/test-entities/user-profile-test.entity";
import { AddressTestEntity } from "@/lib/crud/testing/test-entities/address-test.entity";
import { BuildingTestEntity } from "@/lib/crud/testing/test-entities/building-test.entity";
import { PostTestEntity, PostTestCreateDto } from "@/lib/crud/testing/test-entities/post-test.entity";
import { createPostgresTestContainer, createRedisTestContainer } from "@/lib/crud/testing/test.utils";
import { TestCacheService } from "@/lib/crud/testing/test-cache.service";
import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { StartedRedisContainer } from "@testcontainers/redis";
import { config } from "@/config";

const ctx: ICrudContext = { traceId: "test" };

class UserCacheTestService extends CrudCacheService<UserTestEntity, UserTestCreateDto> {
  cacheNs(_ctx: ICrudContext): string {
    return "users_test";
  }
}

describe("CrudCacheService", () => {
  let pgContainer: StartedPostgreSqlContainer;
  let redisContainer: StartedRedisContainer;
  let dataSource: DataSource;
  let userRepository: Repository<UserTestEntity>;
  let postRepository: Repository<PostTestEntity>;
  let cacheService: TestCacheService;
  let service: UserCacheTestService;

  beforeAll(async () => {
    const pg = await createPostgresTestContainer();
    pgContainer = pg.container;

    const redis = await createRedisTestContainer();
    redisContainer = redis.container;

    cacheService = new TestCacheService({
      url: redis.url,
      keyPrefix: "t:"
    });
    await cacheService.connect();

    dataSource = new DataSource({
      ...pg.opts,
      entities: [UserTestEntity, UserProfileTestEntity, AddressTestEntity, BuildingTestEntity, PostTestEntity],
      synchronize: true,
      logging: config.integrationTest.logQueries
    });
    await dataSource.initialize();

    userRepository = dataSource.getRepository(UserTestEntity);
    postRepository = dataSource.getRepository(PostTestEntity);

    service = new UserCacheTestService("User", userRepository, cacheService, { userScoped: false });
  });

  afterAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    await dataSource?.destroy();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    await cacheService?.disconnect();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    await pgContainer?.stop();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    await redisContainer?.stop();
  });

  beforeEach(async () => {
    await userRepository.deleteAll();
    await cacheService.flush();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Cache hits return JSON-deserialized plain objects (with stringified dates),
  // so we compare a stable subset of fields rather than the full entity.
  const summarize = (users: UserTestEntity[]) =>
    users.map(u => ({ id: u.id, username: u.username, email: u.email }));

  describe("list", () => {
    it("caches the result and serves subsequent calls from cache", async () => {
      await service.create(ctx, { username: "john", email: "john@example.com" });

      const first = await service.list(ctx, {});

      const findSpy = jest.spyOn(userRepository, "find");
      const second = await service.list(ctx, {});

      expect(summarize(second)).toEqual(summarize(first));
      expect(findSpy).not.toHaveBeenCalled();
    });

    it("invalidates the list cache on create", async () => {
      await service.create(ctx, { username: "john", email: "john@example.com" });
      await service.list(ctx, {}); // populate cache

      await service.create(ctx, { username: "jane", email: "jane@example.com" });

      const result = await service.list(ctx, {});
      expect(result).toHaveLength(2);
      expect(result.map(u => u.username).sort()).toEqual(["jane", "john"]);
    });

    it("uses a different cache entry per query", async () => {
      await service.create(ctx, { username: "john", email: "john@a.com" });
      await service.create(ctx, { username: "jane", email: "jane@b.com" });

      const all = await service.list(ctx, {});
      expect(all).toHaveLength(2);

      // Different query → different cache key → DB hit, cached separately.
      const findSpy = jest.spyOn(userRepository, "find");
      const filtered = await service.list(ctx, {
        filter: { eq: [{ key: "username", value: "john" }] }
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].username).toBe("john");
      expect(findSpy).toHaveBeenCalledTimes(1);

      // Same filtered query again → served from cache.
      const filteredAgain = await service.list(ctx, {
        filter: { eq: [{ key: "username", value: "john" }] }
      });
      expect(summarize(filteredAgain)).toEqual(summarize(filtered));
      expect(findSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("get", () => {
    it("caches the result and serves subsequent calls from cache", async () => {
      await service.create(ctx, { username: "john", email: "john@example.com" });

      const first = await service.get(ctx, {
        filter: { eq: [{ key: "username", value: "john" }] }
      });

      const findOneSpy = jest.spyOn(userRepository, "findOne");
      const second = await service.get(ctx, {
        filter: { eq: [{ key: "username", value: "john" }] }
      });

      expect(second?.id).toBe(first?.id);
      expect(second?.username).toBe(first?.username);
      expect(findOneSpy).not.toHaveBeenCalled();
    });

    it("does not cache null results", async () => {
      const first = await service.get(ctx, {
        filter: { eq: [{ key: "username", value: "missing" }] }
      });
      expect(first).toBeNull();

      const findOneSpy = jest.spyOn(userRepository, "findOne");
      const second = await service.get(ctx, {
        filter: { eq: [{ key: "username", value: "missing" }] }
      });
      expect(second).toBeNull();
      // Null results are not cached, so the second call still hits the DB.
      expect(findOneSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("getById", () => {
    it("caches the result and serves subsequent calls from cache", async () => {
      const created = await service.create(ctx, { username: "john", email: "john@example.com" });

      const first = await service.getById(ctx, created.id);

      const findOneSpy = jest.spyOn(userRepository, "findOne");
      const second = await service.getById(ctx, created.id);

      expect(second?.id).toBe(first?.id);
      expect(second?.username).toBe(first?.username);
      expect(findOneSpy).not.toHaveBeenCalled();
    });

    it("invalidates the per-id cache on update", async () => {
      const created = await service.create(ctx, { username: "john", email: "john@example.com" });
      await service.getById(ctx, created.id); // populate per-id cache

      await service.update(ctx, created.id, { username: "john_updated" });

      const result = await service.getById(ctx, created.id);
      expect(result?.username).toBe("john_updated");
    });

    it("invalidates the per-id cache on deleteById", async () => {
      const created = await service.create(ctx, { username: "john", email: "john@example.com" });
      await service.getById(ctx, created.id); // populate per-id cache

      await service.deleteById(ctx, created.id);

      const result = await service.getById(ctx, created.id);
      expect(result).toBeNull();
    });
  });

  describe("listCursor", () => {
    it("caches the result and serves subsequent calls from cache", async () => {
      await service.createBulk(ctx, [
        { username: "john", email: "john@example.com" },
        { username: "jane", email: "jane@example.com" }
      ]);

      const first = await service.listCursor(ctx, { limit: 10 });

      const findSpy = jest.spyOn(userRepository, "find");
      const second = await service.listCursor(ctx, { limit: 10 });

      expect(summarize(second.data)).toEqual(summarize(first.data));
      expect(findSpy).not.toHaveBeenCalled();
    });

    it("invalidates the cursor cache on updateIndexed", async () => {
      await service.createBulk(ctx, [
        { username: "john", email: "john@a.com" },
        { username: "jane", email: "jane@b.com" }
      ]);

      await service.listCursor(ctx, { limit: 10 }); // populate cache

      await service.updateIndexed(
        ctx,
        { eq: [{ key: "username", value: "john" }] },
        { username: "john_updated" }
      );

      const result = await service.listCursor(ctx, { limit: 10 });
      expect(result.data.map((u: UserTestEntity) => u.username).sort()).toEqual(["jane", "john_updated"]);
    });
  });

  describe("invalidation", () => {
    it("increments the generation key on create", async () => {
      const genKey = service.genKey(ctx);
      expect(await cacheService.get(genKey)).toBeNull();

      await service.create(ctx, { username: "john", email: "john@example.com" });
      expect(await cacheService.get(genKey)).toBe("1");

      await service.create(ctx, { username: "jane", email: "jane@example.com" });
      expect(await cacheService.get(genKey)).toBe("2");
    });

    it("deletes the per-id cache on upsert", async () => {
      const created = await service.create(ctx, { username: "john", email: "john@example.com" });
      const idKey = service.idKey(ctx, created.id);

      await service.getById(ctx, created.id); // populate per-id cache
      expect(await cacheService.getJSON(idKey)).not.toBeNull();

      await service.upsert(ctx, {
        id: created.id,
        username: "john_updated",
        email: "john@example.com"
      });

      expect(await cacheService.getJSON(idKey)).toBeNull();
    });

    it("deletes per-id caches on upsertBulk", async () => {
      const a = await service.create(ctx, { username: "john", email: "john@example.com" });
      const b = await service.create(ctx, { username: "jane", email: "jane@example.com" });

      await service.getById(ctx, a.id);
      await service.getById(ctx, b.id);

      expect(await cacheService.getJSON(service.idKey(ctx, a.id))).not.toBeNull();
      expect(await cacheService.getJSON(service.idKey(ctx, b.id))).not.toBeNull();

      await service.upsertBulk(ctx, [
        { id: a.id, username: "john_updated", email: "john@example.com" },
        { id: b.id, username: "jane_updated", email: "jane@example.com" }
      ]);

      expect(await cacheService.getJSON(service.idKey(ctx, a.id))).toBeNull();
      expect(await cacheService.getJSON(service.idKey(ctx, b.id))).toBeNull();
    });

    it("deletes per-id caches on updateIndexed", async () => {
      const a = await service.create(ctx, { username: "john", email: "john@a.com" });
      const b = await service.create(ctx, { username: "jane", email: "jane@a.com" });

      await service.getById(ctx, a.id);
      await service.getById(ctx, b.id);

      await service.updateIndexed(
        ctx,
        { like: [{ key: "email", value: "%@a.com" }] },
        { username: "updated" }
      );

      expect(await cacheService.getJSON(service.idKey(ctx, a.id))).toBeNull();
      expect(await cacheService.getJSON(service.idKey(ctx, b.id))).toBeNull();
    });

    it("deletes per-id caches on deleteIndexed", async () => {
      const a = await service.create(ctx, { username: "john", email: "john@a.com" });
      const b = await service.create(ctx, { username: "jane", email: "jane@a.com" });

      await service.getById(ctx, a.id);
      await service.getById(ctx, b.id);

      await service.deleteIndexed(ctx, { like: [{ key: "email", value: "%@a.com" }] });

      expect(await cacheService.getJSON(service.idKey(ctx, a.id))).toBeNull();
      expect(await cacheService.getJSON(service.idKey(ctx, b.id))).toBeNull();
    });
  });

  describe("user scoped", () => {
    class PostCacheTestService extends CrudCacheService<PostTestEntity, PostTestCreateDto> {
      cacheNs(ctx: ICrudContext): string {
        return ctx.user ? `posts:${ctx.user.userId}` : "posts";
      }
    }

    let postService: PostCacheTestService;
    const user1Ctx: ICrudContext = { traceId: "test", user: { userId: "usr_1" } };
    const user2Ctx: ICrudContext = { traceId: "test", user: { userId: "usr_2" } };

    beforeAll(() => {
      postService = new PostCacheTestService("Post", postRepository, cacheService);
    });

    beforeEach(async () => {
      await postRepository.deleteAll();
    });

    it("isolates caches per user via cacheNs", async () => {
      const post1 = await postService.create(user1Ctx, { title: "User 1 Post" });
      const post2 = await postService.create(user2Ctx, { title: "User 2 Post" });

      // Populate each user's cache.
      await postService.list(user1Ctx, {});
      await postService.list(user2Ctx, {});

      const findSpy = jest.spyOn(postRepository, "find");

      // user1's cached list should not include user2's post and should not hit the DB.
      const user1List = await postService.list(user1Ctx, {});
      expect(user1List).toHaveLength(1);
      expect(user1List[0].title).toBe("User 1 Post");

      const user2List = await postService.list(user2Ctx, {});
      expect(user2List).toHaveLength(1);
      expect(user2List[0].title).toBe("User 2 Post");

      expect(findSpy).not.toHaveBeenCalled();

      // Sanity: the per-id caches live under distinct namespaces.
      expect(service.idKey(user1Ctx, post1.id)).not.toBe(service.idKey(user2Ctx, post2.id));
    });
  });
});
