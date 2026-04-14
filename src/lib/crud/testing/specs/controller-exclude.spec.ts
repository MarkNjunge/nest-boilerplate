/* eslint-disable @typescript-eslint/dot-notation */
import "reflect-metadata";
import { BaseController, BaseRouteNames } from "@/lib/crud/controller/base.controller";
import { CrudController, CrudRouteNames } from "@/lib/crud/controller/crud.controller";
import { BaseEntity } from "@/lib/crud";

class FakeEntity extends BaseEntity {
  idPrefix(): string {
    return "fe_";
  }
}

describe("BaseController exclude", () => {
  const allBaseMethods: BaseRouteNames[] = ["count", "list", "get", "listCursor", "getById"];

  it("should have all methods when no exclusions", () => {
    const Ctrl = BaseController(FakeEntity);
    for (const method of allBaseMethods) {
      expect(Ctrl.prototype[method]).toBeDefined();
    }
  });

  it("should remove excluded methods", () => {
    const Ctrl = BaseController(FakeEntity, { exclude: ["listCursor", "count"] });
    expect(Ctrl.prototype["listCursor"]).toBeUndefined();
    expect(Ctrl.prototype["count"]).toBeUndefined();
    expect(Ctrl.prototype["list"]).toBeDefined();
    expect(Ctrl.prototype["get"]).toBeDefined();
    expect(Ctrl.prototype["getById"]).toBeDefined();
  });
});

describe("CrudController exclude", () => {
  const allCrudMethods: CrudRouteNames[] = [
    "create", "createBulk", "upsert", "upsertBulk",
    "updateIndexed", "update", "deleteIndexed", "deleteById",
  ];
  const allBaseMethods: BaseRouteNames[] = ["count", "list", "get", "listCursor", "getById"];

  it("should have all methods when no exclusions", () => {
    const Ctrl = CrudController(FakeEntity);
    for (const method of [...allBaseMethods, ...allCrudMethods]) {
      expect(Ctrl.prototype[method]).toBeDefined();
    }
  });

  it("should remove excluded crud methods", () => {
    const Ctrl = CrudController(FakeEntity, undefined, undefined, {
      exclude: ["create", "deleteById"],
    });
    expect(Ctrl.prototype["create"]).toBeUndefined();
    expect(Ctrl.prototype["deleteById"]).toBeUndefined();
    expect(Ctrl.prototype["update"]).toBeDefined();
    expect(Ctrl.prototype["list"]).toBeDefined();
  });

  it("should remove excluded base methods via CrudController", () => {
    const Ctrl = CrudController(FakeEntity, undefined, undefined, {
      exclude: ["listCursor", "getById"],
    });
    expect(Ctrl.prototype["listCursor"]).toBeUndefined();
    expect(Ctrl.prototype["getById"]).toBeUndefined();
    expect(Ctrl.prototype["list"]).toBeDefined();
    expect(Ctrl.prototype["create"]).toBeDefined();
  });

  it("should handle mixed base and crud exclusions", () => {
    const Ctrl = CrudController(FakeEntity, undefined, undefined, {
      exclude: ["count", "createBulk", "upsertBulk", "deleteIndexed"],
    });
    expect(Ctrl.prototype["count"]).toBeUndefined();
    expect(Ctrl.prototype["createBulk"]).toBeUndefined();
    expect(Ctrl.prototype["upsertBulk"]).toBeUndefined();
    expect(Ctrl.prototype["deleteIndexed"]).toBeUndefined();
    expect(Ctrl.prototype["list"]).toBeDefined();
    expect(Ctrl.prototype["create"]).toBeDefined();
    expect(Ctrl.prototype["update"]).toBeDefined();
  });
});
