import { DataSource, Repository } from "typeorm";
import { CrudService } from "@/lib/crud/service/crud.service";
import { UserTestEntity, UserTestCreateDto } from "@/lib/crud/testing/test-entities/user-test.entity";
import { UserProfileTestEntity } from "@/lib/crud/testing/test-entities/user-profile-test.entity";
import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { config } from "@/config";
import { AddressTestEntity } from "@/lib/crud/testing/test-entities/address-test.entity";
import { BuildingTestEntity } from "@/lib/crud/testing/test-entities/building-test.entity";
import { PostTestEntity, PostTestCreateDto } from "@/lib/crud/testing/test-entities/post-test.entity";
import { createPostgresTestContainer } from "@/lib/crud/testing/test.utils";
import { ICrudContext } from "@/lib/crud";

const ctx: ICrudContext = { traceId: "test" };
const user1Ctx: ICrudContext = { traceId: "test", user: { userId: "usr_1" } };
const user2Ctx: ICrudContext = { traceId: "test", user: { userId: "usr_2" } };

describe("CRUD Service", () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let userRepository: Repository<UserTestEntity>;
  let profileRepository: Repository<UserProfileTestEntity>;
  let service: CrudService<UserTestEntity, UserTestCreateDto>;

  beforeAll(async () => {
    const { opts, ...rest } = await createPostgresTestContainer();
    container = rest.container;

    dataSource = new DataSource({
      ...opts,
      entities: [UserTestEntity, UserProfileTestEntity, AddressTestEntity, BuildingTestEntity, PostTestEntity],
      synchronize: true,
      logging: config.integrationTest.logQueries
    });

    await dataSource.initialize();
    userRepository = dataSource.getRepository(UserTestEntity);
    profileRepository = dataSource.getRepository(UserProfileTestEntity);
    service = new CrudService("User", userRepository, { userScoped: false });
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await userRepository.deleteAll();
    await profileRepository.deleteAll();
  });

  describe("create", () => {
    it("can create user", async () => {
      const createResult = await service.create(ctx, {
        username: "john",
        email: "john@example.com",
        profile: { bio: "lorem ipsum" }
      });

      expect(createResult.username).toBe("john");
      expect(createResult.profile.bio).toBe("lorem ipsum");

      const repoResult = await userRepository.find();
      expect(repoResult.length).toBe(1);
      expect(repoResult[0].username).toBe("john");
      expect(repoResult[0].profile.bio).toBe("lorem ipsum");
    });

    it("does not override createdAt if already set", async () => {
      const existingDate = new Date("2020-01-01T00:00:00.000Z");

      const result = await service.create(ctx, {
        username: "john",
        email: "john@example.com",
        createdAt: existingDate
      } as any);

      expect(result.createdAt.getTime()).toBe(existingDate.getTime());
    });
  });

  describe("createBulk", () => {
    it("can create multiple users", async () => {
      const users = [
        { username: "john", email: "john@example.com" },
        { username: "jane", email: "jane@example.com" }
      ];

      const result = await service.createBulk(ctx,users);

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe("john");
      expect(result[1].username).toBe("jane");

      const repoResult = await userRepository.find();
      expect(repoResult).toHaveLength(2);
    });
  });

  describe("upsert", () => {
    it("can insert new user", async () => {
      const result = await service.upsert(ctx, {
        username: "john",
        email: "john@example.com"
      });

      expect(result.username).toBe("john");

      const count = await userRepository.count();
      expect(count).toBe(1);
    });

    it("can update existing user", async () => {
      const user = await service.create(ctx, { username: "john", email: "john@example.com" });

      const result = await service.upsert(ctx, {
        id: user.id,
        username: "john_updated",
        email: "john@example.com"
      });

      expect(result.username).toBe("john_updated");

      const count = await userRepository.count();
      expect(count).toBe(1);
    });
  });

  describe("upsertBulk", () => {
    it("can insert and update multiple users", async () => {
      const existing = await service.create(ctx, { username: "john", email: "john@example.com" });

      const data = [
        { id: existing.id, username: "john_updated", email: "john@example.com" },
        { username: "jane", email: "jane@example.com" }
      ];

      const result = await service.upsertBulk(ctx,data);

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe("john_updated");
      expect(result[1].username).toBe("jane");

      const count = await userRepository.count();
      expect(count).toBe(2);
    });
  });

  describe("update", () => {
    it("can update user by id", async () => {
      const user = await service.create(ctx, { username: "john", email: "john@example.com" });

      const result = await service.update(ctx,user.id, { username: "john_updated" });
      if (!result) {
        throw new Error("result is null");
      }

      expect(result.username).toBe("john_updated");
      expect(result.email).toBe("john@example.com");

      const fetched = await userRepository.findOne({ where: { id: user.id } });
      expect(fetched?.username).toBe("john_updated");
    });

    it("updates updatedAt by default", async () => {
      const user = await service.create(ctx, { username: "john", email: "john@example.com" });
      const originalUpdatedAt = user.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 5));
      const result = await service.update(ctx,user.id, { username: "john_updated" });

      expect(result?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it("does not update updatedAt when silent", async () => {
      const user = await service.create(ctx, { username: "john", email: "john@example.com" });
      const originalUpdatedAt = user.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 5));
      const result = await service.update(ctx,user.id, { username: "john_updated" }, {}, { silent: true });

      expect(result?.updatedAt.getTime()).toBe(originalUpdatedAt.getTime());
    });
  });

  describe("updateIndexed", () => {
    it("can update multiple users matching filter", async () => {
      await service.createBulk(ctx,[
        { username: "john", email: "john@a.com" },
        { username: "jane", email: "jane@a.com" },
        { username: "bob", email: "bob@b.com" }
      ]);

      const result = await service.updateIndexed(ctx,
        { like: [{ key: "email", value: "%@a.com" }] },
        { username: "updated" }
      );

      expect(result.length).toBe(2);

      const allUsers = await userRepository.find({ order: { email: "ASC" } });
      expect(allUsers[0].username).toBe("bob"); // bob@b.com unchanged
      expect(allUsers[1].username).toBe("updated"); // jane@a.com
      expect(allUsers[2].username).toBe("updated"); // john@a.com
    });

    it("does nothing when no matches found", async () => {
      const user = await service.create(ctx, { username: "john", email: "john@example.com" });

      const result = await service.updateIndexed(ctx,
        { eq: [{ key: "username", value: "nonexistent" }] },
        { username: "updated" }
      );

      expect(result.length).toBe(0);

      const fetched = await userRepository.findOne({ where: { id: user.id } });
      expect(fetched?.username).toBe("john");
    });

    it("updates updatedAt by default", async () => {
      const user = await service.create(ctx, { username: "john", email: "john@example.com" });
      const originalUpdatedAt = user.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 5));
      const result = await service.updateIndexed(ctx,
        { eq: [{ key: "id", value: user.id }] },
        { username: "john_updated" }
      );

      expect(result[0].updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it("does not update updatedAt when silent", async () => {
      const user = await service.create(ctx, { username: "john", email: "john@example.com" });
      const originalUpdatedAt = user.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 5));
      const result = await service.updateIndexed(ctx,
        { eq: [{ key: "id", value: user.id }] },
        { username: "john_updated" },
        {},
        { silent: true }
      );

      expect(result[0].updatedAt.getTime()).toBe(originalUpdatedAt.getTime());
    });
  });

  describe("deleteById", () => {
    it("can delete user by id", async () => {
      const user = await service.create(ctx, { username: "john", email: "john@example.com" });

      const affected = await service.deleteById(ctx,user.id);

      expect(affected).toBe(1);
      const count = await userRepository.count();
      expect(count).toBe(0);
    });

    it("does nothing when id not found", async () => {
      const affected = await service.deleteById(ctx,"non-existent-id");

      expect(affected).toBe(0);
      // Should not throw error
      const count = await userRepository.count();
      expect(count).toBe(0);
    });
  });

  describe("deleteIndexed", () => {
    it("can delete multiple users matching filter", async () => {
      await service.createBulk(ctx,[
        { username: "john", email: "john@a.com" },
        { username: "jane", email: "jane@a.com" },
        { username: "bob", email: "bob@b.com" }
      ]);

      const affected = await service.deleteIndexed(ctx, {
        like: [{ key: "email", value: "%@a.com" }]
      });

      expect(affected).toBe(2);
      const remaining = await userRepository.find();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].username).toBe("bob");
    });

    it("does nothing when no matches found", async () => {
      await service.create(ctx, { username: "john", email: "john@example.com" });

      const affected = await service.deleteIndexed(ctx, {
        eq: [{ key: "username", value: "nonexistent" }]
      });

      expect(affected).toBe(0);
      const count = await userRepository.count();
      expect(count).toBe(1);
    });
  });

  describe("user scoping", () => {
    let postRepository: Repository<PostTestEntity>;
    let postService: CrudService<PostTestEntity, PostTestCreateDto>;

    beforeAll(() => {
      postRepository = dataSource.getRepository(PostTestEntity);
      postService = new CrudService("Post", postRepository);
    });

    beforeEach(async () => {
      await postRepository.deleteAll();
    });

    it("create sets userId from context", async () => {
      const post = await postService.create(user1Ctx, { title: "Hello" });
      expect(post.userId).toBe("usr_1");
    });

    it("createBulk sets userId from context on all records", async () => {
      const posts = await postService.createBulk(user1Ctx, [{ title: "A" }, { title: "B" }]);
      expect(posts.every(p => p.userId === "usr_1")).toBe(true);
    });

    it("list only returns the current user's records", async () => {
      await postService.create(user1Ctx, { title: "User 1 Post" });
      await postService.create(user2Ctx, { title: "User 2 Post" });

      const result = await postService.list(user1Ctx, {});
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe("usr_1");
    });

    it("getById returns null for another user's record", async () => {
      const post = await postService.create(user1Ctx, { title: "User 1 Post" });
      const result = await postService.getById(user2Ctx, post.id);
      expect(result).toBeNull();
    });

    it("update cannot affect another user's record", async () => {
      const post = await postService.create(user1Ctx, { title: "Original" });
      const result = await postService.update(user2Ctx, post.id, { title: "Hacked" });
      expect(result).toBeNull();

      const unchanged = await postService.getById(user1Ctx, post.id);
      expect(unchanged?.title).toBe("Original");
    });

    it("deleteById cannot delete another user's record", async () => {
      const post = await postService.create(user1Ctx, { title: "User 1 Post" });
      const affected = await postService.deleteById(user2Ctx, post.id);
      expect(affected).toBe(0);

      const count = await postRepository.count();
      expect(count).toBe(1);
    });

    it("deleteIndexed only deletes the current user's matching records", async () => {
      await postService.create(user1Ctx, { title: "shared title" });
      await postService.create(user2Ctx, { title: "shared title" });

      const affected = await postService.deleteIndexed(user1Ctx, {
        eq: [{ key: "title", value: "shared title" }]
      });

      expect(affected).toBe(1);
      const remaining = await postRepository.find();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].userId).toBe("usr_2");
    });

    it("throws when context has no user", async () => {
      await expect(postService.list({ traceId: "test" }, {})).rejects.toThrow("User context missing");
    });

    describe("userScoped: false in context", () => {
      it("update can modify another user's record", async () => {
        const post = await postService.create(user1Ctx, { title: "Original" });
        const result = await postService.update({ ...user2Ctx, userScoped: false }, post.id, { title: "Updated" });
        expect(result?.title).toBe("Updated");
      });

      it("deleteById can delete another user's record", async () => {
        const post = await postService.create(user1Ctx, { title: "User 1 Post" });
        const affected = await postService.deleteById({ ...user2Ctx, userScoped: false }, post.id);
        expect(affected).toBe(1);
        const count = await postRepository.count();
        expect(count).toBe(0);
      });

      it("deleteIndexed deletes matching records across all users", async () => {
        await postService.create(user1Ctx, { title: "shared title" });
        await postService.create(user2Ctx, { title: "shared title" });

        const affected = await postService.deleteIndexed({ ...user1Ctx, userScoped: false }, {
          eq: [{ key: "title", value: "shared title" }]
        });

        expect(affected).toBe(2);
      });

      it("does not affect the original context (still scoped)", async () => {
        const post = await postService.create(user1Ctx, { title: "User 1 Post" });
        await postService.deleteById({ ...user2Ctx, userScoped: false }, post.id);
        // Confirm original scoping still prevents user2 from seeing user1 data
        const result = await postService.getById(user2Ctx, post.id);
        expect(result).toBeNull();
      });
    });
  });
});
