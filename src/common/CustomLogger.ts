import { LoggerService } from "@nestjs/common";
import * as winston from "winston";
import * as moment from "moment";
import { config } from "./Config";
import { IncomingMessage } from "http";
import { FastifyRequest } from "fastify";

export class CustomLogger implements LoggerService {
  constructor(private readonly name: string = "Application") {}

  log(message: string, name?: string) {
    winston.info(`[${name || this.name}] ${message}`);
  }
  error(message: string, trace: string, name?: string) {
    winston.error({
      message: `[${name || this.name}] ${message}`,
      meta: {
        stacktrace: trace,
      },
    });
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
  logRoute(
    request: FastifyRequest<IncomingMessage>,
    statusCode: number,
    requestTime: number = null,
  ) {
    const method = request.req.method;
    const url = request.req.url;

    if (requestTime != null) {
      const totalTime = moment().valueOf() - requestTime;
      const message = `${method} ${url} - ${statusCode} - ${totalTime}ms`;
      winston.info(`[ROUTE] ${message}`);
    } else {
      const message = `${method} ${url} - ${statusCode}`;
      winston.info(`[ROUTE] ${message}`);
    }
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
    format: combine(timestamp(), myFormat),
    transports: [
      new winston.transports.Console({
        format: combine(myFormat, colorize({ all: true })),
      }),
    ],
  });
}
