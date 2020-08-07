import { LoggerService } from "@nestjs/common";
import * as winston from "winston";
import * as moment from "moment";
import { config } from "../Config";
import { FastifyRequest, FastifyReply } from "fastify";
import { SampleTransport } from "./Sample.transport";
import { removeSensitiveParams } from "./remove-sensitive";

export class CustomLogger implements LoggerService {
  constructor(private readonly name: string = "Application") {}

  log(message: string, name?: string, data?: any) {
    const tag = name || this.name;
    data = removeSensitiveParams({ ...data, tag });
    winston.info({ message: `[${tag}] ${message}`, data });
  }
  error(message: string, name?: string, data?: any) {
    const tag = name || this.name;
    data = removeSensitiveParams({ ...data, tag });
    winston.error({ message: `[${name || this.name}] ${message}`, data });
  }
  warn(message: string, name?: string, data?: any) {
    const tag = name || this.name;
    data = removeSensitiveParams({ ...data, tag });
    winston.warn({ message: `[${name || this.name}] ${message}`, data });
  }
  debug(message: string, name?: string, data?: any) {
    const tag = name || this.name;
    data = removeSensitiveParams({ ...data, tag });
    winston.debug({ message: `[${name || this.name}] ${message}`, data });
  }
  verbose(message: string, name?: string, data?: any) {
    const tag = name || this.name;
    data = removeSensitiveParams({ ...data, tag });
    winston.verbose({ message: `[${name || this.name}] ${message}`, data });
  }
  logRoute(
    request: FastifyRequest,
    response: FastifyReply,
    responseBody?: any,
  ) {
    const statusCode = response.statusCode;
    const method = request.method;
    const url = request.url;
    const tag = "ROUTE";

    const requestTime = parseInt(request.headers["x-request-time"] as string);
    const requestTimeISO = moment(requestTime).toISOString();
    const duration = moment().valueOf() - requestTime;

    let data = {
      tag,
      request: {
        url,
        method,
        requestTime: requestTimeISO,
        ip: request.headers["x-forwarded-for"] || request.ip,
        query: Object.assign({}, request.query),
        body: Object.assign({}, request.body),
      },
      response: {
        duration,
        statusCode,
        body: responseBody,
      },
    };
    data = removeSensitiveParams(data);

    const message = `${method} ${url} - ${statusCode} - ${duration}ms`;

    winston.info({ message: `[${tag}] ${message}`, data });
  }
}

export function initializeWinston() {
  const { combine, timestamp, printf, colorize } = winston.format;

  const myFormat = printf(({ level, message, logTimestamp }) => {
    const m = moment(logTimestamp);
    const formattedTimestamp = m.format(config.logging.timestampFormat);
    return `${formattedTimestamp} | ${level}: ${message}`;
  });

  winston.configure({
    level: "debug",
    format: combine(timestamp(), myFormat),
    transports: [
      new SampleTransport(),
      new winston.transports.Console({
        format: combine(myFormat, colorize({ all: true })),
      }),
    ],
  });
}
