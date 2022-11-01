import { LoggerService } from "@nestjs/common";
import { Logger } from "./Logger";

export class ApplicationLogger implements LoggerService {
  private logger = new Logger("NestApplication");

  log(message: string): void {
    this.logger.info(message);
  }

  error(message: string): void {
    this.logger.error(new Error(message));
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  debug(message: string): void {
    this.logger.debug(message);
  }

  verbose(message: string): void {
    this.logger.verbose(message);
  }
}
