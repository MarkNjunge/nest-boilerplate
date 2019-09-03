import { LoggerService } from "@nestjs/common";
import * as winston from "winston";
import * as moment from "moment";
import { config } from "./Config";

export class CustomLogger implements LoggerService {
  constructor(private readonly name: string = "Application") {}

  log(message: string, name?: string) {
    winston.info(`[${name || this.name}] ${message}`);
  }
  error(message: string, trace: string, name?: string) {
    winston.error(`[${name || this.name}] ${message}`);
  }
  warn(message: string, name?: string) {
    winston.warn(`[${name || this.name}] ${message}`);
  }
  debug(message: string, name?: string) {
    winston.debug(`[${name || this.name}] ${message}`);
  }
  verbose(message: string, name?: string) {
    winston.verbose(`[${name || this.name}] ${message}`);
  }
}

export function initializeWinston() {
  const { combine, timestamp, printf, colorize } = winston.format;

  const myFormat = printf(({ level, message, logTimestamp }) => {
    const m = moment(logTimestamp);
    const formattedTimestamp = m.format(config.loggerTimestampFormat);
    return `${formattedTimestamp} | ${level}: ${message}`;
  });

  winston.configure({
    level: "debug",
    format: combine(timestamp(), colorize({ all: true }), myFormat),
    transports: [new winston.transports.Console()],
  });
}
