import { faker } from "@faker-js/faker/locale/en";

interface ArtilleryContext {
  vars: Record<string, string>;
}

export function generateUserData(
  context: ArtilleryContext,
  _events: unknown,
  done: () => void,
): void {
  const username = faker.internet.displayName();
  context.vars.username = username;
  context.vars.email = `${username}@mail.com`;
  context.vars.updatedUsername = `${username}_2025`;
  done();
}

export function checkSearchResult(
  req: unknown,
  res: { statusCode: number; body: string },
  context: ArtilleryContext,
  _events: unknown,
  done: (err?: Error) => void,
): void {
  const expected = context.vars.username;
  const actual = context.vars.searchUsername;
  if (actual !== expected) {
    done(
      new Error(
        `Search returned username "${actual}", expected "${expected}"`,
      ),
    );
    return;
  }
  done();
}

export function generateSearchData(
  context: ArtilleryContext,
  _events: unknown,
  done: () => void,
): void {
  context.vars.searchTerm = faker.string.alpha(3);
  const pastDate = faker.date.recent({ days: 30 });
  context.vars.searchDate = pastDate.toISOString();
  done();
}
