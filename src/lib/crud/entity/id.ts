import { monotonicFactory } from "ulid";

const ulid = monotonicFactory();

export function genId(prefix: string): string {
  return `${prefix}${ulid().toLowerCase()}`;
}
