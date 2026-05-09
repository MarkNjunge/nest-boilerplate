import { DataSource } from "typeorm";
// noinspection ES6PreferShortImport
import { config } from "../../config"; // Do not use @/ because of TypeORM CLI
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm";

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
  retryDelay: config.db.retryDelay
};

export default new DataSource(dbOptions as DataSourceOptions);
