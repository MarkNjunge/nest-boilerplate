import { clone, isCyclic } from "@/utils/clone";

describe("clone", () => {
  describe("isCyclic", () => {
    it("returns true for cyclic", () => {
      const x: any = {
        a: "b",
        c: {
          a: "b",
        },
      };
      x.x = x;

      expect(isCyclic(x)).toBe(true);
    });

    it("returns true for cyclic arrays", () => {
      const x: any = [
        {
          a: "b",
          c: {
            a: "b",
          },
        },
      ];
      x[0].x = x[0];

      expect(isCyclic(x)).toBe(true);
    });

    it("returns false for non-cyclic", () => {
      const x: any = {
        a: "b",
        c: {
          a: "b",
        },
      };

      expect(isCyclic(x)).toBe(false);
    });
  });

  describe("clone", () => {
    it("can clone", () => {
      const x: any = {
        a: "b",
        c: {
          a: "b",
        },
      };

      expect(clone(x)).not.toBe(x);
    });

    it("can clone circular references", () => {
      const x: any = {
        a: "b",
        c: {
          a: "b",
        },
      };
      x.x = x;

      expect(clone(x)).not.toBe(x);
    });

    it("can clone buffers", () => {
      const x: any = {
        a: "b",
        b: Buffer.from("abc123"),
      };

      expect(clone(x)).not.toBe(x);
    });
  });
});
