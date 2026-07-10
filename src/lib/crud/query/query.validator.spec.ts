import { validateFilter, validateSort } from "@/lib/crud/query";

describe("Query Validator", () => {
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
