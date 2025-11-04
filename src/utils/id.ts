import { ulid } from "ulid";

const seedTime = new Date("2025-01-01T00:00:00.000Z").getTime();

export function genId(prefix: string): string {
  return `${prefix}${ulid(seedTime).toLowerCase()}`;
}
