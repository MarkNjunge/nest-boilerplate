import { Injectable } from "@nestjs/common";
import Knex, { Knex as KType } from "knex";
import { Model } from "objection";
import knexConfig from "../../db/knexfile";
import { config } from "@/config";
import { Logger } from "@/logging/Logger";

@Injectable()
export class DbService {
  knex: KType;

  private logger = new Logger("DbService");

  constructor() {
    this.knex = Knex(knexConfig);
    Model.knex(this.knex);

    if (config.db.logQueries) {
      this.knex.on("query", queryData => {
        this.logger.debug(this.fillBindings(queryData.sql, queryData.bindings));
      });
    }
  }

  async testConnection() {
    await this.knex.raw("SELECT 1");
  }

  async migrateLatest() {
    await this.knex.migrate.latest();
  }

  private fillBindings(sql: string, bindings: any[] = []): string {
    for (let i = 0; i < bindings.length; i++) {
      let binding = bindings[i];
      if (typeof binding === "string") {
        binding = `'${binding}'`;
      }
      sql = sql.replace(`$${i + 1}`, binding);
    }

    return sql;
  }
}
