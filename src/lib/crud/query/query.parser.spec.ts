import { parseRawQuery, parseRawSort, Query, RawQuery } from "@/lib/crud/query";

describe("Query", () => {
  describe("parseRawQuery", () => {
    it("can parse", () => {
      const reqQuery: RawQuery = {
        select: "title,comments.content,comments.user.username",
        include: "stock,comments.user,agent.organization.owner",
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
        include: { stock: true, comments: { user: true }, agent: { organization: { owner: true } } },
        filter: {
          eq: [{ key: "postId", value: "post_" }],
          lt: [{ key: "createdAt", value: "2025-11-04T06:55:40.549Z" }],
          between: [{ key: "price", value: "120", secondValue: "200" }],
          in: [{ key: "tags", value: ["tagA", "tagB", "tagC"] }]
        },
        sort: { user: { name: "ASC", email: "DESC" }, averageRating: "ASC", price: "DESC" },
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

    it("can validate offset is a number", () => {
      expect(() => parseRawQuery({ offset: "abc" })).toThrow("abc is not a valid number");
    });

    it("can validate limit is a number", () => {
      expect(() => parseRawQuery({ limit: "xyz" })).toThrow("xyz is not a valid number");
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

});
