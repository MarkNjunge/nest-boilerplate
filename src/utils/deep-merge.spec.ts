import { deepMerge } from "./deep-merge";

describe("deepMerge", () => {
  describe("basic merging", () => {
    it("should merge two simple objects", () => {
      const target = { a: 1, b: 2 };
      const source = { c: 3 };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("should override target values with source values", () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3 };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: 3 });
    });

    it("should return a copy of target when source is empty", () => {
      const target = { a: 1, b: 2 };
      const source = {};
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("should return source properties when target is empty", () => {
      const target = {};
      const source = { a: 1, b: 2 };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });

  describe("deep merging", () => {
    it("should deeply merge nested objects", () => {
      const target = { a: { b: 1, c: 2 } };
      const source = { a: { d: 3 } };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: { b: 1, c: 2, d: 3 } });
    });

    it("should override nested values", () => {
      const target = { a: { b: 1, c: 2 } };
      const source = { a: { b: 10 } };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: { b: 10, c: 2 } });
    });

    it("should handle multiple levels of nesting", () => {
      const target = { a: { b: { c: 1 } } };
      const source = { a: { b: { d: 2 } } };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: { b: { c: 1, d: 2 } } });
    });

    it("should add new nested objects from source", () => {
      const target = { a: 1 };
      const source = { b: { c: 2 } };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: { c: 2 } });
    });
  });

  describe("array handling", () => {
    it("should replace arrays instead of merging them", () => {
      const target = { a: [1, 2, 3] };
      const source = { a: [4, 5] };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: [4, 5] });
    });

    it("should handle arrays at different nesting levels", () => {
      const target = { a: { b: [1, 2] } };
      const source = { a: { b: [3, 4, 5] } };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: { b: [3, 4, 5] } });
    });
  });

  describe("primitive value handling", () => {
    it("should handle string values", () => {
      const target = { a: "hello" };
      const source = { a: "world" };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: "world" });
    });

    it("should handle boolean values", () => {
      const target = { a: true };
      const source = { a: false };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: false });
    });

    it("should handle null values", () => {
      const target = { a: 1 };
      const source = { a: null };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: null });
    });

    it("should handle undefined values", () => {
      const target = { a: 1 };
      const source = { a: undefined };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: undefined });
    });
  });

  describe("immutability", () => {
    it("should not modify the original target object", () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 } };
      const originalTarget = JSON.parse(JSON.stringify(target));
      deepMerge(target, source);
      expect(target).toEqual(originalTarget);
    });

    it("should not modify the original source object", () => {
      const target = { a: 1 };
      const source = { b: { c: 2 } };
      const originalSource = JSON.parse(JSON.stringify(source));
      deepMerge(target, source);
      expect(source).toEqual(originalSource);
    });

    it("should return a new object", () => {
      const target = { a: 1 };
      const source = { b: 2 };
      const result = deepMerge(target, source);
      expect(result).not.toBe(target);
      expect(result).not.toBe(source);
    });
  });

  describe("edge cases", () => {
    it("should handle deeply nested objects being replaced by primitives", () => {
      const target = { a: { b: { c: 1 } } };
      const source = { a: 5 };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 5 });
    });

    it("should handle primitives being replaced by objects", () => {
      const target = { a: 5 };
      const source = { a: { b: 1 } };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: { b: 1 } });
    });

    it("should handle mixed nested structures", () => {
      const target = {
        a: 1,
        b: { c: 2, d: { e: 3 } },
        f: [1, 2]
      };
      const source = {
        b: { c: 20, d: { g: 4 } },
        f: [3, 4, 5],
        h: "new"
      };
      const result = deepMerge(target, source);
      expect(result).toEqual({
        a: 1,
        b: { c: 20, d: { e: 3, g: 4 } },
        f: [3, 4, 5],
        h: "new"
      });
    });

    it("should handle objects with numeric keys", () => {
      const target = { 1: "a", 2: "b" };
      const source = { 2: "c", 3: "d" };
      const result = deepMerge(target, source);
      expect(result).toEqual({ 1: "a", 2: "c", 3: "d" });
    });
  });

  describe("non-object inputs", () => {
    it("should handle null target", () => {
      const target = null;
      const source = { a: 1 };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1 });
    });

    it("should handle null source", () => {
      const target = { a: 1 };
      const source = null;
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1 });
    });

    it("should handle both null", () => {
      const result = deepMerge(null, null);
      expect(result).toEqual({});
    });
  });
});
