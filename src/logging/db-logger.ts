import { AbstractLogger, LogLevel, LogMessage, QueryRunner } from "typeorm";
import { Logger } from "@/logging/Logger";
import { config } from "@/config";

export class DbLogger extends AbstractLogger {
  private logger = new Logger("DB");

  protected writeLog(level: LogLevel, message: LogMessage | string | number | (LogMessage | string | number)[], queryRunner?: QueryRunner): void {
    if (!config.db.logQueries) {
      return;
    }
    if (!Array.isArray(message)) {
      message = [message];
    }

    message.forEach(msg => {
      if (typeof msg === "string" || typeof msg === "number") {
        this.logger.debug(msg as string);
      } else {
        const logStr = this.fillBindings(msg.message as string, msg.parameters);
        if (msg.type === "error" || msg.type === "query-error") {
          this.logger.error(logStr);
        } else if (level === "warn" || msg.type === "query-slow") {
          this.logger.warn(logStr);
        } else {
          this.logger.debug(logStr);
        }
      }
    });
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
