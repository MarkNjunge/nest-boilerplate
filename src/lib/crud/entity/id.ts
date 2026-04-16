import { monotonicFactory } from "ulid";

const seedTime = new Date("2025-01-01T00:00:00.000Z").getTime();
const ulid = monotonicFactory();

export function genId(prefix: string): string {
  return `${prefix}${ulid(seedTime).toLowerCase()}`;
}
