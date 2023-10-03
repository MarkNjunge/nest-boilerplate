import { parseQuery } from "./query-parser";

describe("query-parser", () => {
  it("can parse", () => {
    const reqQuery = {
      filter: "(salePrice,>,120):(price,<,170):(slug,=,cappuccino)",
      limit: 10,
      page: 2,
      after: "2972257566156921974",
      orderBy: "(averageRating,ASC):(price,DESC)",
    };
    const res = parseQuery(reqQuery);
    expect(res).toEqual({
      limit: 10,
      page: 2,
      orders: [
        { key: "id", direction: "ASC" },
        { key: "average_rating", direction: "ASC" },
        { key: "price", direction: "DESC" },
      ],
      filters: [
        { key: "id", op: ">", value: "2972257566156921974" },
        { key: "sale_price", op: ">", value: "120" },
        { key: "price", op: "<", value: "170" },
        { key: "slug", op: "=", value: "cappuccino" },
      ],
    });
  });
});
