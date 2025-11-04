import { DataSource } from "typeorm";
// noinspection ES6PreferShortImport
import { config } from "../../config"; // Do not use @/ because of TypeORM CLI
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm/data-source/DataSourceOptions";

export const dbOptions: TypeOrmModuleOptions | DataSourceOptions = {
  type: "postgres",
  url: config.db.url,
  // https://typeorm.io/docs/data-source/null-and-undefined-handling
  invalidWhereValuesBehavior: {
    null: "sql-null",
    undefined: "throw"
  },
  logging: true,
  entities: ["dist/models/**/*.js"],
  subscribers: [],
  migrationsRun: true,
  migrations: ["dist/db/migrations/*.js"],
  migrationsTableName: "migrations",
};

export default new DataSource(dbOptions as DataSourceOptions);
