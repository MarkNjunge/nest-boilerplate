import {
  parseRawQuery,
  Query,
  RawQuery,
  validateFilter,
  validateSort
} from "@/db/query/query";

describe("Query", () => {
  describe("parseRawQuery", () => {
    it("can parse", () => {
      const reqQuery: RawQuery = {
        select: "title,comments.content,comments.user.username",
        include: "stock",
        filter: "(postId,eq,post_):(createdAt,lt,2025-11-04T06:55:40.549Z):(price,between,120,200)",
        limit: "10",
        offset: "20",
        sort: "(averageRating,ASC):(price,DESC)"
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
          between: [{ key: "price", value: "120", secondValue: "200" }]
        },
        sort: { averageRating: "ASC", price: "DESC" },
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

  describe("validateOrderBy", () => {
    it("can validate empty", () => {
      const actual = validateSort("");
      expect(actual).toBe(true);
    });

    it("can validate single", () => {
      const actual = validateSort("(averageRating,ASC)");
      expect(actual).toBe(true);
    });

    it("can validate direction", () => {
      const actual = validateSort("(averageRating,up)");
      expect(actual).toBe(false);
    });

    it("can validate multiple", () => {
      const actual = validateSort("(averageRating,ASC):(price1,DESC)");
      expect(actual).toBe(true);
    });

    it("can fail invalid", () => {
      const actual = validateSort("(averageRating,ASC):(price1,DESC");
      expect(actual).toBe(false);
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
  });
});
