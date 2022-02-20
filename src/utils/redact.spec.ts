import { redact } from "./redact";

describe("redact", () => {
  it("can redact", () => {
    const object = {
      name: "user name",
      header: {
        Authorization: "abc123",
      },
      body: {
        password: ["abc123"],
        user: {
          password: "abc123",
        },
        users: [{ password: "abc123" }],
      },
    };
    const expected = {
      name: "user name",
      header: {
        Authorization: "REDACTED",
      },
      body: {
        password: ["REDACTED"],
        user: {
          password: "REDACTED",
        },
        users: [{ password: "REDACTED" }],
      },
    };
    const actual = redact(object);
    expect(actual).toEqual(expected);
  });
});
