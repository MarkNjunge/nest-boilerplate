import { DataSource, Repository } from "typeorm";
import { TransactionService } from "@/lib/crud/transaction/transaction.service";
import { CrudService } from "@/lib/crud/service/crud.service";
import { UserTestEntity, UserTestCreateDto } from "@/lib/crud/testing/test-entities/user-test.entity";
import { UserProfileTestEntity } from "@/lib/crud/testing/test-entities/user-profile-test.entity";
import { AddressTestEntity } from "@/lib/crud/testing/test-entities/address-test.entity";
import { BuildingTestEntity } from "@/lib/crud/testing/test-entities/building-test.entity";
import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { config } from "@/config";
import { createTestContainer } from "@/lib/crud/testing/test.utils";

describe("TransactionService", () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let userRepository: Repository<UserTestEntity>;
  let transactionService: TransactionService;
  let userService: CrudService<UserTestEntity, UserTestCreateDto>;

  beforeAll(async () => {
    const { opts, ...rest } = await createTestContainer();
    container = rest.container;

    dataSource = new DataSource({
      ...opts,
      entities: [UserTestEntity, UserProfileTestEntity, AddressTestEntity, BuildingTestEntity],
      synchronize: true,
      logging: config.integrationTest.logQueries
    });

    await dataSource.initialize();
    userRepository = dataSource.getRepository(UserTestEntity);
    transactionService = new TransactionService(dataSource);
    userService = new CrudService("User", userRepository);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await userRepository.deleteAll();
  });

  describe("run", () => {
    it("commits on success", async () => {
      const result = await transactionService.run(async manager => {
        const txService = userService.withTransaction(manager);
        return txService.create({ username: "john", email: "john@example.com" });
      });

      expect(result.username).toBe("john");

      const count = await userRepository.count();
      expect(count).toBe(1);
    });

    it("rolls back on error", async () => {
      await expect(
        transactionService.run(async manager => {
          const txService = userService.withTransaction(manager);
          await txService.create({ username: "john", email: "john@example.com" });
          throw new Error("Simulated failure");
        })
      ).rejects.toThrow("Simulated failure");

      const count = await userRepository.count();
      expect(count).toBe(0);
    });

    it("supports multiple operations in a single transaction", async () => {
      const result = await transactionService.run(async manager => {
        const txService = userService.withTransaction(manager);
        const user1 = await txService.create({ username: "john", email: "john@example.com" });
        const user2 = await txService.create({ username: "jane", email: "jane@example.com" });
        return [user1, user2];
      });

      expect(result).toHaveLength(2);

      const count = await userRepository.count();
      expect(count).toBe(2);
    });

    it("rolls back all operations when later operation fails", async () => {
      await expect(
        transactionService.run(async manager => {
          const txService = userService.withTransaction(manager);
          await txService.create({ username: "john", email: "john@example.com" });
          await txService.create({ username: "jane", email: "jane@example.com" });
          throw new Error("Late failure");
        })
      ).rejects.toThrow("Late failure");

      const count = await userRepository.count();
      expect(count).toBe(0);
    });
  });

  describe("withTransaction", () => {
    it("clone uses transaction-scoped repository", async () => {
      await transactionService.run(async manager => {
        const txService = userService.withTransaction(manager);
        const created = await txService.create({ username: "tx-user", email: "tx@example.com" });
        expect(created.username).toBe("tx-user");

        const found = await txService.getById(created.id);
        expect(found).not.toBeNull();
        expect(found?.username).toBe("tx-user");
      });
    });

    it("preserves service methods from subclass prototype", async () => {
      await transactionService.run(async manager => {
        const txService = userService.withTransaction(manager);
        // Verify all inherited methods are available on the clone
        expect(typeof txService.create).toBe("function");
        expect(typeof txService.list).toBe("function");
        expect(typeof txService.getById).toBe("function");
        expect(typeof txService.update).toBe("function");
        expect(typeof txService.deleteById).toBe("function");
        // Verify the clone actually works
        await txService.create({ username: "proto-test", email: "proto@example.com" });
      });
    });
  });
});
