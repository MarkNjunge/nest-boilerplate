/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as winston from "winston";
import { config } from "../config";
import { FastifyRequest, FastifyReply } from "fastify";
import { SampleTransport } from "./Sample.transport";
import * as dayjs from "dayjs";

export class Logger {
  constructor(private readonly name: string) {}

  info(message: string, name?: string, data?: any) {
    const tag = name || this.name;
    winston.info({ message: `[${tag}] ${message}`, data });
  }
  error(message: string, name?: string, data?: any) {
    const tag = name || this.name;
    winston.error({ message: `[${tag}] ${message}`, data });
  }
  warn(message: string, name?: string, data?: any) {
    const tag = name || this.name;
    winston.warn({ message: `[${tag}] ${message}`, data });
  }
  debug(message: string, name?: string, data?: any) {
    const tag = name || this.name;
    winston.debug({ message: `[${tag}] ${message}`, data });
  }
  verbose(message: string, name?: string, data?: any) {
    const tag = name || this.name;
    winston.verbose({ message: `[${tag}] ${message}`, data });
  }
  // eslint-disable-next-line max-lines-per-function
  logRoute(
    request: FastifyRequest,
    response: FastifyReply,
    responseBody?: any,
  ) {
    const statusCode = response.statusCode;
    const method = request.method;
    const url = request.url;
    const tag = "ROUTE";
    const correlationId = request.headers["x-correlation-id"];

    const requestTime = parseInt(request.headers["x-request-time"] as string);
    const requestTimeISO = dayjs(requestTime).toISOString();
    const duration = dayjs().valueOf() - requestTime;

    const data = {
      tag,
      request: {
        url,
        method,
        requestTime: requestTimeISO,
        ip: request.headers["x-forwarded-for"] || request.ip,
        correlationId,
        headers: request.headers,
        query: Object.assign({}, request.query),
        body: Object.assign({}, request.body),
      },
      response: {
        duration,
        statusCode,
        headers: response.getHeaders(),
        body: responseBody,
      },
    };

    const message = `${method} ${url} - ${statusCode} - ${duration}ms`;

    winston.info({ message: `[${tag}] ${message}`, data });
  }
}

export function initializeWinston() {
  const { combine, timestamp, printf, colorize } = winston.format;

  const myFormat = printf(({ level, message, timestamp }) => {
    const formattedTimestamp = dayjs(timestamp).format(
      config.logging.timestampFormat,
    );

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
