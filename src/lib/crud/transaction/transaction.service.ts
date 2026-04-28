import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { Logger } from "@/logging/Logger";

export type IsolationLevel = "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE";

export interface TransactionOptions {
  isolationLevel?: IsolationLevel;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger("TransactionService");

  constructor(private readonly dataSource: DataSource) {}

  async run<T>(
    callback: (manager: EntityManager) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T> {
    this.logger.debug("Starting transaction", {
      data: { isolationLevel: options?.isolationLevel },
    });

    try {
      const result = options?.isolationLevel ?
        await this.dataSource.transaction(options.isolationLevel, callback) :
        await this.dataSource.transaction(callback);

      this.logger.debug("Transaction committed");
      return result;
    } catch (error) {
      this.logger.error("Transaction rolled back", {
        data: { error: (error as Error).message },
      });
      throw error;
    }
  }
}
