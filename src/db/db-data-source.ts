import { DataSource } from "typeorm";
import { config } from "@/config";
import { TlsOptions } from "tls";
import * as path from "path";

let ssl: boolean | TlsOptions = config.db.ssl;
if (config.db.ssl) {
  ssl = {
    // This accepts a self signed certificate
    // See node-postgres docs for how to verify
    // https://node-postgres.com/features/ssl
    rejectUnauthorized: false,
  };
}

export const dataSource = new DataSource({
  type: "postgres",
  url: config.db.url,
  entities: [path.join(__dirname, "../models/**/*.entity{.ts,.js}")],
  migrations: [path.join(__dirname, "../db/migration/*{.ts,.js}")],
  migrationsRun: true,
  synchronize: false,
  ssl,
});
