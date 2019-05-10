import { LoggerService } from "@nestjs/common";
import * as winston from "winston";

export class CustomLogger implements LoggerService {
  constructor(private readonly name: string = "Application") {}

  log(message: string, name?: string) {
    winston.info(`[${name || this.name}] ${message}`);
  }
  error(message: string, trace: string, name?: string) {
    winston.error(`[${name || this.name}] ${message}`);
  }
  warn(message: string) {
    winston.warn(`[${this.name}] ${message}`);
  }
  debug(message: string) {
    winston.debug(`[${this.name}] ${message}`);
  }
  verbose(message: string) {
    winston.verbose(`[${this.name}] ${message}`);
  }
}
