import { DataSource, Repository } from "typeorm";
import { BaseService } from "@/db/crud/base.service";
import { UserTestEntity } from "@/db/crud/test-entities/user-test.entity";
import { UserProfileTestEntity } from "@/db/crud/test-entities/user-profile-test.entity";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { DataSourceOptions } from "typeorm/data-source/DataSourceOptions";
import { config } from "@/config";
import { AddressTestEntity } from "@/db/crud/test-entities/address-test.entity";
import { BuildingTestEntity } from "@/db/crud/test-entities/building-test.entity";

describe("Base Service", () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let userRepository: Repository<UserTestEntity>;
  let profileRepository: Repository<UserProfileTestEntity>;
  let service: BaseService<UserTestEntity>;

  beforeAll(async () => {
    let opts: DataSourceOptions;

    if (config.test.db === "postgres") {
      container = await new PostgreSqlContainer("postgres:18.0").start();
      opts = {
        type: "postgres",
        host: container.getHost(),
        port: container.getPort(),
        username: container.getUsername(),
        password: container.getPassword(),
        database: container.getDatabase()
      };
    } else {
      opts = {
        type: "sqlite",
        database: ":memory:"
      };
    }

    dataSource = new DataSource({
      ...opts,
      entities: [UserTestEntity, UserProfileTestEntity, AddressTestEntity, BuildingTestEntity],
      synchronize: true,
      logging: config.test.logQueries
    });

    await dataSource.initialize();
    userRepository = dataSource.getRepository(UserTestEntity);
    profileRepository = dataSource.getRepository(UserProfileTestEntity);
    service = new BaseService("User", userRepository);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await userRepository.deleteAll();
    await profileRepository.deleteAll();
  });

  describe("count", () => {
    it("can count all users", async () => {
      const users = [
        userRepository.create({ username: "john", email: "john@example.com" }),
        userRepository.create({ username: "jane", email: "jane@example.com" })
      ];
      await userRepository.save(users);

      const result = await service.count({});

      expect(result).toBe(2);
    });

    it("can count with filters", async () => {
      const users = [
        userRepository.create({ username: "john", email: "john@example.com" }),
        userRepository.create({ username: "jane", email: "jane@example.com" })
      ];
      await userRepository.save(users);

      const result = await service.count({
        filter: { eq: [{ key: "username", value: "john" }] }
      });

      expect(result).toBe(1);
    });
  });

  describe("list", () => {
    it("can return all users when no filters applied", async () => {
      const user1 = userRepository.create({
        username: "john",
        email: "john@example.com",
        profile: { bio: "lorem ipsum" },
        address: {
          building: {
            suite: "A01"
          }
        }
      });
      const user2 = userRepository.create({
        username: "jane",
        email: "jane@example.com",
        profile: {}
      });
      await userRepository.save([user1, user2]);

      const result = await service.list({});

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe("john");
      expect(result[0].profile.bio).toBe("lorem ipsum");
      expect(result[1].username).toBe("jane");
    });

    it("can filter users by username", async () => {
      const user1 = userRepository.create({ username: "john", email: "john@example.com" });
      const user2 = userRepository.create({ username: "jane", email: "jane@example.com" });
      await userRepository.save([user1, user2]);

      const result = await service.list({ filter: { eq: [{ key: "username", value: "john" }] } });

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe("john");
      expect(result[0].email).toBe("john@example.com");
    });

    it("can return empty array when no matches found", async () => {
      const user = userRepository.create({ username: "john", email: "john@example.com" });
      await userRepository.save(user);

      const result = await service.list({
        filter: {
          eq: [{
            key: "username",
            value: "nonexistent"
          }]
        }
      });

      expect(result).toEqual([]);
    });

    it("can order results by username ascending", async () => {
      const users = [
        userRepository.create({ username: "charlie", email: "charlie@example.com" }),
        userRepository.create({ username: "alice", email: "alice@example.com" }),
        userRepository.create({ username: "bob", email: "bob@example.com" })
      ];
      await userRepository.save(users);

      const result = await service.list({ sort: { username: "ASC" } });

      expect(result).toHaveLength(3);
      expect(result[0].username).toBe("alice");
      expect(result[1].username).toBe("bob");
      expect(result[2].username).toBe("charlie");
    });

    it("can apply skip and take for pagination", async () => {
      const users = Array.from({ length: 10 }, (_, i) =>
        userRepository.create({ username: `user${i}`, email: `user${i}@example.com` })
      );
      await userRepository.save(users);

      const result = await service.list({
        offset: 3,
        limit: 5,
        sort: { username: "ASC" }
      });

      expect(result[0].username).toBe("user3");
      expect(result).toHaveLength(5);
    });

    it("can combine filters, ordering, and pagination", async () => {
      const users = [
        userRepository.create({ username: "alice", email: "alice@a.com" }),
        userRepository.create({ username: "bob", email: "bob@b.com" }),
        userRepository.create({ username: "charlie", email: "charlie@a.com" }),
        userRepository.create({ username: "david", email: "david@a.com" })
      ];
      await userRepository.save(users);

      const result = await service.list({
        filter: { like: [{ key: "email", value: "%@a.com" }] },
        sort: { username: "ASC" },
        offset: 1,
        limit: 2
      });

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe("charlie");
      expect(result[1].username).toBe("david");
    });

    it("can include relations", async () => {
      const user1 = userRepository.create({
        username: "john",
        email: "john@example.com",
        profile: { bio: "lorem ipsum" },
        address: {
          building: {
            suite: "A01"
          }
        }
      });
      await userRepository.save([user1]);

      const result = await service.list({ include: ["address.building"] });

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe("john");
      expect(result[0].profile.bio).toBe("lorem ipsum");
      expect(result[0].address.building.suite).toBe("A01");
    });
  });

  describe("get", () => {
    it("can get a single user", async () => {
      const user = userRepository.create({ username: "john", email: "john@example.com" });
      await userRepository.save(user);

      const result = await service.get({
        filter: { eq: [{ key: "username", value: "john" }] }
      });

      expect(result).not.toBeNull();
      expect(result?.username).toBe("john");
    });

    it("returns null when no match found", async () => {
      const result = await service.get({
        filter: { eq: [{ key: "username", value: "nonexistent" }] }
      });

      expect(result).toBeNull();
    });
  });

  describe("getById", () => {
    it("can get user by id", async () => {
      const user = userRepository.create({ username: "john", email: "john@example.com" });
      const saved = await userRepository.save(user);

      const result = await service.getById(saved.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(saved.id);
      expect(result?.username).toBe("john");
    });

    it("can get user by id with relations", async () => {
      const user = userRepository.create({
        username: "john",
        email: "john@example.com",
        profile: { bio: "lorem ipsum" },
        address: {
          building: {
            suite: "A01"
          }
        }
      });
      const saved = await userRepository.save(user);

      const result = await service.getById(saved.id, {
        include: ["address.building"]
      });

      expect(result).not.toBeNull();
      expect(result?.profile.bio).toBe("lorem ipsum");
      expect(result?.address.building.suite).toBe("A01");
    });

    it("returns null when id not found", async () => {
      const result = await service.getById("non-existent-id");

      expect(result).toBeNull();
    });
  });

  describe("listCursor", () => {
    it("returns first page with correct pageInfo", async () => {
      const users = [
        userRepository.create({ username: "user1", email: "user1@example.com" }),
        userRepository.create({ username: "user2", email: "user2@example.com" }),
        userRepository.create({ username: "user3", email: "user3@example.com" })
      ];
      await userRepository.save(users);

      const result = await service.listCursor({ limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBe(result.data[0].id);
      expect(result.pageInfo.endCursor).toBe(result.data[1].id);
    });

    it("paginates forward using after cursor", async () => {
      const users = [
        userRepository.create({ username: "user1", email: "user1@example.com" }),
        userRepository.create({ username: "user2", email: "user2@example.com" }),
        userRepository.create({ username: "user3", email: "user3@example.com" })
      ];
      await userRepository.save(users);

      const firstPage = await service.listCursor({ limit: 1 });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const secondPage = await service.listCursor({ limit: 1, after: firstPage.pageInfo.endCursor! });

      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.data[0].id).not.toBe(firstPage.data[0].id);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
      expect(secondPage.pageInfo.hasNextPage).toBe(true);
    });

    it("paginates backward using before cursor", async () => {
      const users = [
        userRepository.create({ username: "user1", email: "user1@example.com" }),
        userRepository.create({ username: "user2", email: "user2@example.com" }),
        userRepository.create({ username: "user3", email: "user3@example.com" })
      ];
      await userRepository.save(users);

      const lastPage = await service.listCursor({ limit: 1 });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const nextPage = await service.listCursor({ limit: 1, after: lastPage.pageInfo.endCursor! });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const previousPage = await service.listCursor({ limit: 1, before: nextPage.pageInfo.startCursor! });

      expect(previousPage.data).toHaveLength(1);
      expect(previousPage.data[0].id).toBe(lastPage.data[0].id);
      expect(previousPage.pageInfo.hasNextPage).toBe(true);
    });

    it("throws error when both after and before cursors provided", async () => {
      await expect(
        service.listCursor({ after: "cursor1", before: "cursor2" })
      ).rejects.toThrow("Cannot use both 'after' and 'before' cursors");
    });

    it("works with filters", async () => {
      const users = [
        userRepository.create({ username: "alice", email: "alice@a.com" }),
        userRepository.create({ username: "bob", email: "bob@b.com" }),
        userRepository.create({ username: "charlie", email: "charlie@a.com" })
      ];
      await userRepository.save(users);

      const result = await service.listCursor({
        filter: { like: [{ key: "email", value: "%@a.com" }] },
        limit: 10
      });

      expect(result.data).toHaveLength(2);
      expect(result.data.every(u => u.email.endsWith("@a.com"))).toBe(true);
    });

    it("handles empty results", async () => {
      const result = await service.listCursor({ limit: 10 });

      expect(result.data).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("respects limit parameter", async () => {
      const users = Array.from({ length: 10 }, (_, i) =>
        userRepository.create({ username: `user${i}`, email: `user${i}@example.com` })
      );
      await userRepository.save(users);

      const result = await service.listCursor({ limit: 5 });

      expect(result.data).toHaveLength(5);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("returns hasNextPage false on last page", async () => {
      const users = [
        userRepository.create({ username: "user1", email: "user1@example.com" }),
        userRepository.create({ username: "user2", email: "user2@example.com" })
      ];
      await userRepository.save(users);

      const result = await service.listCursor({ limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });
});
