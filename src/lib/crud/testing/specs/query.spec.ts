import {
  parseRawQuery,
  parseRawSort,
  Query,
  RawQuery,
  validateFilter,
  validateSort
} from "@/lib/crud/query/query";

describe("Query", () => {
  describe("parseRawQuery", () => {
    it("can parse", () => {
      const reqQuery: RawQuery = {
        select: "title,comments.content,comments.user.username",
        include: "stock",
        filter: "(postId,eq,post_):(createdAt,lt,2025-11-04T06:55:40.549Z):(price,between,120,200):(tags,in,tagA|tagB|tagC)",
        limit: "10",
        offset: "20",
        sort: "(user.name,ASC):(user.email,DESC):(averageRating,ASC):(price,DESC)"
      };

      const expected: Query = {
        select: {
          title: true,
          comments: {
            content: true,
            user: {
              username: true
            }
          }
        },
        include: ["stock"],
        filter: {
          eq: [{ key: "postId", value: "post_" }],
          lt: [{ key: "createdAt", value: "2025-11-04T06:55:40.549Z" }],
          between: [{ key: "price", value: "120", secondValue: "200" }],
          in: [{ key: "tags", value: ["tagA", "tagB", "tagC"] }]
        },
        sort: { user: { name:"ASC", email: "DESC" }, averageRating: "ASC", price: "DESC" },
        limit: 10,
        offset: 20
      };

      const actual = parseRawQuery(reqQuery);

      expect(actual).toEqual(expected);
    });

    it("can parse empty", () => {
      const actual = parseRawQuery({});

      expect(actual).toEqual({ limit: 20 });
    });
  });

  describe("validateSort", () => {
    it("can validate empty", () => {
      const actual = validateSort("");
      expect(actual).toBe(true);
    });

    it("can validate single", () => {
      const actual = validateSort("(averageRating,ASC)");
      expect(actual).toBe(true);
    });

    it("can validate nested key", () => {
      const actual = validateSort("(user.name,ASC)");
      expect(actual).toBe(true);
    });

    it("can validate multiple", () => {
      const actual = validateSort("(averageRating,ASC):(price1,DESC)");
      expect(actual).toBe(true);
    });

    it("can validate multiple nested", () => {
      const actual = validateSort("(user.name,ASC):(user.email,DESC)");
      expect(actual).toBe(true);
    });

    it("can validate direction", () => {
      const actual = validateSort("(averageRating,up)");
      expect(actual).toBe(false);
    });

    it("can fail invalid", () => {
      const actual = validateSort("(averageRating,ASC):(price1,DESC");
      expect(actual).toBe(false);
    });
  });

  describe("parseRawSort", () => {
    it("parses single flat key", () => {
      const actual = parseRawSort("(name,ASC)");
      expect(actual).toEqual({ name: "ASC" });
    });

    it("parses multiple flat keys", () => {
      const actual = parseRawSort("(name,ASC):(email,DESC)");
      expect(actual).toEqual({ name: "ASC", email: "DESC" });
    });

    it("parses nested key", () => {
      const actual = parseRawSort("(user.name,ASC)");
      expect(actual).toEqual({ user: { name: "ASC" } });
    });

    it("parses multiple nested keys on same parent", () => {
      const actual = parseRawSort("(user.name,ASC):(user.email,DESC)");
      expect(actual).toEqual({ user: { name: "ASC", email: "DESC" } });
    });

    it("parses mixed flat and nested keys", () => {
      const actual = parseRawSort("(id,ASC):(user.email,DESC)");
      expect(actual).toEqual({ id: "ASC", user: { email: "DESC" } });
    });

    it("parses deeply nested key", () => {
      const actual = parseRawSort("(a.b.c,ASC)");
      expect(actual).toEqual({ a: { b: { c: "ASC" } } });
    });
  });

  describe("validateFilter", () => {
    it("can validate empty", () => {
      const actual = validateFilter("");
      expect(actual).toBe(true);
    });

    it("can validate single", () => {
      const actual = validateFilter("(salePrice,gt,120)");
      expect(actual).toBe(true);
    });

    it("can validate without", () => {
      const actual = validateFilter("(salePrice,isnull)");
      expect(actual).toBe(true);
    });

    it("can validate with second value", () => {
      const actual = validateFilter("(salePrice,between,120,200)");
      expect(actual).toBe(true);
    });

    it("can validate operand", () => {
      const actual = validateFilter("(salePrice,=,120)");
      expect(actual).toBe(false);
    });

    it("can validate multiple", () => {
      const actual = validateFilter("(postId,eq,post_01jgfjjz000vsmgkfszk6mer1k):(createdAt,lt,2025-11-04T06:55:40.549Z)");
      expect(actual).toBe(true);
    });

    it("can fail invalid", () => {
      const actual = validateFilter("(salePrice,gt,120):(price,lt,170");
      expect(actual).toBe(false);
    });

    it("will fail with raw", () => {
      const actual = validateFilter("(salePrice,raw,120)");
      expect(actual).toBe(false);
    });
  });
});
