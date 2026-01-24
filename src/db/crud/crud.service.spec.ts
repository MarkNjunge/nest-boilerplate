import { DataSource, Repository } from "typeorm";
import { CrudService } from "@/db/crud/crud.service";
import { UserTestEntity, UserTestCreateDto } from "@/db/crud/test-entities/user-test.entity";
import { UserProfileTestEntity } from "@/db/crud/test-entities/user-profile-test.entity";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { DataSourceOptions } from "typeorm/data-source/DataSourceOptions";
import { config } from "@/config";
import { AddressTestEntity } from "@/db/crud/test-entities/address-test.entity";
import { BuildingTestEntity } from "@/db/crud/test-entities/building-test.entity";

describe("CRUD Service", () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let userRepository: Repository<UserTestEntity>;
  let profileRepository: Repository<UserProfileTestEntity>;
  let service: CrudService<UserTestEntity, UserTestCreateDto>;

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
    service = new CrudService("User", userRepository);
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
      const createResult = await service.create({
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
  });

  describe("createBulk", () => {
    it("can create multiple users", async () => {
      const users = [
        { username: "john", email: "john@example.com" },
        { username: "jane", email: "jane@example.com" }
      ];

      const result = await service.createBulk(users);

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe("john");
      expect(result[1].username).toBe("jane");

      const repoResult = await userRepository.find();
      expect(repoResult).toHaveLength(2);
    });
  });

  describe("upsert", () => {
    it("can insert new user", async () => {
      const result = await service.upsert({
        username: "john",
        email: "john@example.com"
      });

      expect(result.username).toBe("john");

      const count = await userRepository.count();
      expect(count).toBe(1);
    });

    it("can update existing user", async () => {
      const user = await userRepository.save(
        userRepository.create({ username: "john", email: "john@example.com" })
      );

      const result = await service.upsert({
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
      const existing = await userRepository.save(
        userRepository.create({ username: "john", email: "john@example.com" })
      );

      const data = [
        { id: existing.id, username: "john_updated", email: "john@example.com" },
        { username: "jane", email: "jane@example.com" }
      ];

      const result = await service.upsertBulk(data);

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe("john_updated");
      expect(result[1].username).toBe("jane");

      const count = await userRepository.count();
      expect(count).toBe(2);
    });
  });

  describe("update", () => {
    it("can update user by id", async () => {
      const user = await userRepository.save(
        userRepository.create({ username: "john", email: "john@example.com" })
      );

      const result = await service.update(user.id, { username: "john_updated" });
      if (!result) {
        throw new Error("result is null");
      }

      expect(result.username).toBe("john_updated");
      expect(result.email).toBe("john@example.com");

      const fetched = await userRepository.findOne({ where: { id: user.id } });
      expect(fetched?.username).toBe("john_updated");
    });
  });

  describe("updateIndexed", () => {
    it("can update multiple users matching filter", async () => {
      const users = [
        userRepository.create({ username: "john", email: "john@a.com" }),
        userRepository.create({ username: "jane", email: "jane@a.com" }),
        userRepository.create({ username: "bob", email: "bob@b.com" })
      ];
      await userRepository.save(users);

      const result = await service.updateIndexed(
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
      const user = await userRepository.save(
        userRepository.create({ username: "john", email: "john@example.com" })
      );

      const result = await service.updateIndexed(
        { eq: [{ key: "username", value: "nonexistent" }] },
        { username: "updated" }
      );

      expect(result.length).toBe(0);

      const fetched = await userRepository.findOne({ where: { id: user.id } });
      expect(fetched?.username).toBe("john");
    });
  });

  describe("deleteById", () => {
    it("can delete user by id", async () => {
      const user = await userRepository.save(
        userRepository.create({ username: "john", email: "john@example.com" })
      );

      await service.deleteById(user.id);

      const count = await userRepository.count();
      expect(count).toBe(0);
    });

    it("does nothing when id not found", async () => {
      await service.deleteById("non-existent-id");

      // Should not throw error
      const count = await userRepository.count();
      expect(count).toBe(0);
    });
  });

  describe("deleteIndexed", () => {
    it("can delete multiple users matching filter", async () => {
      const users = [
        userRepository.create({ username: "john", email: "john@a.com" }),
        userRepository.create({ username: "jane", email: "jane@a.com" }),
        userRepository.create({ username: "bob", email: "bob@b.com" })
      ];
      await userRepository.save(users);

      await service.deleteIndexed({
        like: [{ key: "email", value: "%@a.com" }]
      });

      const remaining = await userRepository.find();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].username).toBe("bob");
    });

    it("does nothing when no matches found", async () => {
      await userRepository.save(
        userRepository.create({ username: "john", email: "john@example.com" })
      );

      await service.deleteIndexed({
        eq: [{ key: "username", value: "nonexistent" }]
      });

      const count = await userRepository.count();
      expect(count).toBe(1);
    });
  });
});
