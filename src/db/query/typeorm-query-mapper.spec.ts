import * as typeorm from "typeorm";
import { mapFilterOp, mapQueryToTypeorm, parseFilter } from "@/db/query/typeorm-query-mapper";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Column, DataSource, Entity, Repository } from "typeorm";
import { DataSourceOptions } from "typeorm/data-source/DataSourceOptions";
import { config } from "@/config";
import { BaseEntity } from "@/models/_base/_base.entity";

interface Building {
  suite: string;
}

interface Address {
  building: Building;
}

interface Profile {
  bio: string;
}

interface User {
  username: string;
  status: "A" | "B" | "C";
  createdAt: Date;
  profile: Profile;
  address: Address;
}

@Entity({ name: "filter_entities" })
export class FilterEntity extends BaseEntity {
  @Column({ type: "text", nullable: true })
  text?: string | null;

  @Column({ type: "int", nullable: true })
  number: number;

  @Column("text", { array: true, nullable: true })
  arrayField: string[];

  idPrefix(): string {
    return "fe_";
  }
}

describe("TypeORM Query Mapper", () => {
  let isPg = false;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let repository: Repository<FilterEntity>;

  beforeAll(async () => {
    let opts: DataSourceOptions;

    if (config.test.db === "postgres") {
      isPg = true;
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
      entities: [FilterEntity],
      synchronize: true,
      logging: config.test.logQueries
    });

    await dataSource.initialize();
    repository = dataSource.getRepository(FilterEntity);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await repository.deleteAll();
  });

  describe("mapQueryToTypeorm", () => {
    it("can map", () => {
      const expected: typeorm.FindManyOptions<User> = {
        select: ["username"],
        relations: {
          profile: true,
          address: {
            building: true
          }
        },
        order: {
          createdAt: "DESC"
        },
        where: {
          username: typeorm.Equal("Mark"),
          status: typeorm.And(typeorm.Equal("A"), typeorm.Equal("B"), typeorm.Not("C"))
        },
        skip: 100,
        take: 10
      };

      const actual = mapQueryToTypeorm<User>({
        select: ["username"],
        include: ["profile", "address.building"],
        sort: {
          createdAt: "DESC"
        },
        filter: {
          eq: [
            { key: "username", value: "Mark" },
            { key: "status", value: "A" },
            { key: "status", value: "B" }
          ],
          ne: [
            { key: "status", value: "C" }
          ]
        },
        limit: 10,
        offset: 100
      });

      expect(actual).toEqual(expected);
    });
  });

  describe("parseFilter", () => {
    it("can parse basic", () => {
      const basicExpected: typeorm.FindOptionsWhere<User> = {
        username: typeorm.Equal("Mark"),
        status: typeorm.And(typeorm.Equal("A"), typeorm.Equal("B"), typeorm.Not("C"))
      };

      const actual = parseFilter<User>({
        eq: [
          { key: "username", value: "Mark" },
          { key: "status", value: "A" },
          { key: "status", value: "B" }
        ],
        ne: [
          { key: "status", value: "C" }
        ]
      });

      expect(actual).toEqual(basicExpected);
    });

    it("can parse with or", () => {
      const actual = parseFilter<User>({
        or: [
          {
            eq: [{ key: "username", value: "Mark" }]
          },
          {
            eq: [{ key: "username", value: "John" }]
          }
        ]
      });

      const expected: typeorm.FindOptionsWhere<User>[] = [
        { username: typeorm.Equal("Mark") },
        { username: typeorm.Equal("John") }
      ];

      expect(actual).toEqual(expected);
    });

    it("can parse with and", () => {
      const actual = parseFilter<User>({
        and: [
          {
            eq: [{ key: "username", value: "Mark" }]
          },
          {
            eq: [{ key: "status", value: "A" }]
          }
        ]
      });

      const expected: typeorm.FindOptionsWhere<User> = {
        username: typeorm.Equal("Mark"),
        status: typeorm.Equal("A")
      };

      expect(actual).toEqual(expected);
    });

    it("can parse with complex and conditions on same key", () => {
      const actual = parseFilter<User>({
        and: [
          {
            eq: [{ key: "status", value: "A" }]
          },
          {
            eq: [{ key: "status", value: "B" }]
          },
          {
            ne: [{ key: "status", value: "C" }]
          }
        ]
      });

      const expected: typeorm.FindOptionsWhere<User> = {
        status: typeorm.And(
          typeorm.Equal("A"),
          typeorm.Equal("B"),
          typeorm.Not("C")
        )
      };

      expect(actual).toEqual(expected);
    });

    it("can parse with nested or and and", () => {
      const actual = parseFilter<User>({
        or: [
          {
            and: [
              { eq: [{ key: "username", value: "Mark" }] },
              { eq: [{ key: "status", value: "A" }] }
            ]
          },
          {
            and: [
              { eq: [{ key: "username", value: "John" }] },
              { eq: [{ key: "status", value: "B" }] }
            ]
          }
        ]
      });

      const expected: typeorm.FindOptionsWhere<User>[] = [
        {
          username: typeorm.Equal("Mark"),
          status: typeorm.Equal("A")
        },
        {
          username: typeorm.Equal("John"),
          status: typeorm.Equal("B")
        }
      ];

      expect(actual).toEqual(expected);
    });
  });

  describe("mapFilterOp", () => {
    it("can map eq", async () => {
      const item = repository.create({ text: "john" });
      await repository.save(item);

      const where = parseFilter<FilterEntity>({
        eq: [{ key: "text", value: "john" }]
      });
      const res = await repository.find({ where });

      expect(res[0].text).toBe("john");
    });

    it("can map ne", async () => {
      await repository.save(repository.create({ text: "john" }));
      await repository.save(repository.create({ text: "jane" }));

      const where = parseFilter<FilterEntity>({
        ne: [{ key: "text", value: "john" }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(1);
      expect(res[0].text).toBe("jane");
    });

    it("can map like", async () => {
      await repository.save(repository.create({ text: "john" }));
      await repository.save(repository.create({ text: "jane" }));

      const where = parseFilter<FilterEntity>({
        like: [{ key: "text", value: "jo%" }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(1);
      expect(res[0].text).toBe("john");
    });

    it("can map ilike", async () => {
      await repository.save(repository.create({ text: "John" }));
      await repository.save(repository.create({ text: "jane" }));

      const where = parseFilter<FilterEntity>({
        ilike: [{ key: "text", value: "jo%" }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(1);
      expect(res[0].text).toBe("John");
    });

    it("can map gt", async () => {
      await repository.save(repository.create({ number: 10 }));
      await repository.save(repository.create({ number: 5 }));

      const where = parseFilter<FilterEntity>({
        gt: [{ key: "number", value: 5 }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(1);
      expect(res[0].number).toBe(10);
    });

    it("can map lt", async () => {
      await repository.save(repository.create({ number: 10 }));
      await repository.save(repository.create({ number: 5 }));

      const where = parseFilter<FilterEntity>({
        lt: [{ key: "number", value: 10 }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(1);
      expect(res[0].number).toBe(5);
    });

    it("can map gte", async () => {
      await repository.save(repository.create({ number: 10 }));
      await repository.save(repository.create({ number: 5 }));

      const where = parseFilter<FilterEntity>({
        gte: [{ key: "number", value: 5 }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(2);
    });

    it("can map lte", async () => {
      await repository.save(repository.create({ number: 10 }));
      await repository.save(repository.create({ number: 5 }));

      const where = parseFilter<FilterEntity>({
        lte: [{ key: "number", value: 10 }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(2);
    });

    it("can map in", async () => {
      await repository.save(repository.create({ text: "john" }));
      await repository.save(repository.create({ text: "jane" }));
      await repository.save(repository.create({ text: "mike" }));

      const where = parseFilter<FilterEntity>({
        in: [{ key: "text", value: ["john", "jane"] }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(2);
      expect(res.map(r => r.text).sort()).toEqual(["jane", "john"]);
    });

    it("can map notin", async () => {
      await repository.save(repository.create({ text: "john" }));
      await repository.save(repository.create({ text: "jane" }));
      await repository.save(repository.create({ text: "mike" }));

      const where = parseFilter<FilterEntity>({
        notin: [{ key: "text", value: ["john", "jane"] }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(1);
      expect(res[0].text).toBe("mike");
    });

    it("can map isnull", async () => {
      await repository.save(repository.create({ text: "john" }));
      await repository.save(repository.create({ text: null }));

      const where = parseFilter<FilterEntity>({
        isnull: [{ key: "text", value: undefined }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(1);
      expect(res[0].text).toBeNull();
    });

    it("can map isnotnull", async () => {
      await repository.save(repository.create({ text: "john" }));
      await repository.save(repository.create({ text: null }));

      const where = parseFilter<FilterEntity>({
        isnotnull: [{ key: "text", value: undefined }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(1);
      expect(res[0].text).toBe("john");
    });

    it("can map between", async () => {
      await repository.save(repository.create({ number: 5 }), { transaction: false });
      await repository.save(repository.create({ number: 10 }), { transaction: false });
      await repository.save(repository.create({ number: 16 }), { transaction: false });

      const where = parseFilter<FilterEntity>({
        between: [{ key: "number", value: 5, secondValue: 15 }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(2);
      expect(res.map(r => r.number).sort()).toEqual([10, 5]);
    });

    it("can map notbetween", async () => {
      await repository.save(repository.create({ number: 5 }), { transaction: false });
      await repository.save(repository.create({ number: 10 }), { transaction: false });
      await repository.save(repository.create({ number: 16 }), { transaction: false });

      const where = parseFilter<FilterEntity>({
        notbetween: [{ key: "number", value: 5, secondValue: 15 }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(1);
      expect(res[0].number).toBe(16);
    });

    it("can map any", async () => {
      if (isPg) {
        await repository.save(repository.create({ number: 10 }));
        await repository.save(repository.create({ number: 5 }));
        await repository.save(repository.create({ number: 15 }));

        const where = parseFilter<FilterEntity>({
          any: [{ key: "number", value: [5, 10] as any }]
        });
        const res = await repository.find({ where });

        expect(res.length).toBe(2);
        expect(res.map(r => r.number)).toContain(5);
        expect(res.map(r => r.number)).toContain(10);
      }
    });

    it("can map none", async () => {
      if (isPg) {
        await repository.save(repository.create({ number: 10 }));
        await repository.save(repository.create({ number: 5 }));
        await repository.save(repository.create({ number: 15 }));

        const where = parseFilter<FilterEntity>({
          none: [{ key: "number", value: [5, 10] as any }]
        });
        const res = await repository.find({ where });

        expect(res.length).toBe(1);
        expect(res[0].number).toBe(15);
      }
    });

    it("can map contains", async () => {
      if (isPg) {
        await repository.save(repository.create({ arrayField: ["a", "b", "c"] }));
        await repository.save(repository.create({ arrayField: ["d", "e"] }));

        const where = parseFilter<FilterEntity>({
          contains: [{ key: "arrayField", value: ["b"] }]
        });
        const res = await repository.find({ where });

        expect(res.length).toBe(1);
        expect(res[0].arrayField).toEqual(["a", "b", "c"]);
      }
    });

    it("can map containedby", async () => {
      if (isPg) {
        await repository.save(repository.create({ arrayField: ["a", "b"] }));
        await repository.save(repository.create({ arrayField: ["a", "b", "x"] }));

        const where = parseFilter<FilterEntity>({
          containedby: [{ key: "arrayField", value: ["a", "b", "c"] }]
        });
        const res = await repository.find({ where });

        expect(res.length).toBe(1);
        expect(res[0].arrayField).toEqual(["a", "b"]);
      }
    });

    it("can map raw", async () => {
      await repository.save(repository.create({ number: 10 }));
      await repository.save(repository.create({ number: 5 }));

      const where = parseFilter<FilterEntity>({
        raw: [{ key: "number", value: "number > :val", secondValue: { val: 5 } as any }]
      });
      const res = await repository.find({ where });

      expect(res.length).toBe(1);
      expect(res[0].number).toBe(10);
    });

    // Error tests for operators requiring secondValue
    it("throws error for between without secondValue", () => {
      expect(() => mapFilterOp("between", 5)).toThrow("secondValue is required for 'between' operator");
    });

    it("throws error for notbetween without secondValue", () => {
      expect(() => mapFilterOp("notbetween", 5)).toThrow("secondValue is required for 'notbetween' operator");
    });
  });
});
