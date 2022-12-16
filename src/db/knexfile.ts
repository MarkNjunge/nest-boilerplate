import * as path from "path";
import * as fs from "fs";
// noinspection ES6PreferShortImport
import { config } from "../config";

const migrationsDir = path.resolve(path.join(__dirname, "migrations"));

// Nest will run after compilation to js, so the migration will have a name of *.js
// This basically makes it such that the name will not have an extension
// See knex/lib/migrations/migrate/sources/fs-migrations.js
class CustomMigrationSource {
  // noinspection JSUnusedGlobalSymbols
  async getMigrations() {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => {
        const isTs = file.endsWith(".ts") && !file.endsWith(".d.ts");
        const isJs = file.endsWith(".js");
        return isTs || isJs;
      });
    return Promise.resolve(migrationFiles);
  }

  // noinspection JSUnusedGlobalSymbols
  getMigrationName(migration) {
    return migration.split(".")[0]; // Assumes no . in the migration file name
  }

  // noinspection JSUnusedGlobalSymbols
  getMigration(migration) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(path.join(migrationsDir, migration));
  }
}

export const knexConfig = {
  client: "pg",
  connection: config.db.url,
  migrations: {
    tableName: "migrations",
    migrationSource: new CustomMigrationSource(),
  },
  acquireConnectionTimeout: 1000,
};

export default knexConfig;
