import { DataSource, DefaultNamingStrategy, Table } from "typeorm";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm";

// noinspection ES6PreferShortImport
import { config } from "../../config"; // Do not use @/ because of TypeORM CLI

export class CustomNamingStrategy extends DefaultNamingStrategy {
  primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    const table = typeof tableOrName === "string" ? tableOrName : tableOrName.name;
    return `PK__${table}`;
  }

  foreignKeyName(tableOrName: Table | string, columnNames: string[]) {
    const table = typeof tableOrName === "string" ? tableOrName : tableOrName.name;
    return `FK__${table}__${columnNames.join("_")}`;
  }
}

export const dbOptions: TypeOrmModuleOptions | DataSourceOptions = {
  type: "postgres",
  url: config.db.url,
  // https://typeorm.io/docs/data-source/null-and-undefined-handling
  invalidWhereValuesBehavior: {
    null: "sql-null",
    undefined: "throw"
  },
  logging: true,
  entities: ["dist/src/models/**/*.js"],
  subscribers: [],
  migrationsRun: config.db.runMigrations,
  migrations: ["dist/src/db/migrations/*.js"],
  migrationsTableName: "migrations",
  poolSize: config.db.poolSize,
  verboseRetryLog: true,
  connectTimeoutMS: config.db.connectTimeoutMS,
  retryAttempts: config.db.retryAttempts,
  retryDelay: config.db.retryDelay,
  namingStrategy: new CustomNamingStrategy()
};

export default new DataSource(dbOptions as DataSourceOptions);
