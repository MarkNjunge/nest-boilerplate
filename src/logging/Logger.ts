import * as winston from "winston";
import { bool, config } from "../config";
import { FastifyRequest, FastifyReply } from "fastify";
import { SampleTransport } from "./Sample.transport";
import * as dayjs from "dayjs";
import { redact, clone } from "@/utils";
import { IReqCtx } from "@/decorators/request-context.decorator";
import { LokiTransport } from "@/logging/loki.transport";
import * as Transport from "winston-transport";

export class ILogMeta {
  // A tag indicating what this error relates to. Usually based on the stack.
  tag?: string;

  // Explicit traceId if instrumentation does not inject it
  traceId?: string;

  // Extra data
  data?: any;
}

export class Logger {
  constructor(private readonly name: string) {}

  info(message: string, meta: ILogMeta = {}): void {
    const tag = meta.tag ?? this.name;
    winston.info({
      message: `[${tag}] ${message}`,
      data: Logger.getData(tag, message, meta),
    });
  }

  error(message: string, meta: ILogMeta = {}, error?: Error): void {
    const tag = meta.tag ?? this.name;
    const data = Logger.getData(tag, message, meta);
    if (error?.stack) {
      data.stacktrace = error.stack;
    }
    winston.error({ message: `[${tag}] ${message}`, data });
  }

  warn(message: string, meta: ILogMeta = {}): void {
    const tag = meta.tag ?? this.name;
    winston.warn({
      message: `[${tag}] ${message}`,
      data: Logger.getData(tag, message, meta),
    });
  }

  debug(message: string, meta: ILogMeta = {}): void {
    const tag = meta.tag ?? this.name;
    winston.debug({
      message: `[${tag}] ${message}`,
      data: Logger.getData(tag, message, meta),
    });
  }

  verbose(message: string, meta: ILogMeta = {}): void {
    const tag = meta.tag ?? this.name;
    winston.verbose({
      message: `[${tag}] ${message}`,
      data: Logger.getData(tag, message, meta),
    });
  }

  logRoute(
    request: FastifyRequest,
    response: FastifyReply,
    responseBody?: any,
  ): void {
    const statusCode = response.statusCode;
    const method = request.method;
    const url = request.url;
    const tag = "ROUTE";
    const ip = request.headers["x-ip"] as string;

    const requestTime = parseInt(request.headers["x-request-time"] as string);
    const requestTimeISO = dayjs(requestTime).toISOString();
    const duration = dayjs().valueOf() - requestTime;

    const data = {
      tag,
      request: {
        url,
        method,
        requestTime: requestTimeISO,
        ip,
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

    this.info(message, { tag, data });
  }

  private static getData(tag: string, message: string, meta: ILogMeta = {}): any {
    const data = clone(meta.data) ?? {};
    data.tag = tag;
    data.message = message;
    if (meta.traceId) {
      data.traceId = meta.traceId;
    }
    return redact(data);
  }
}

export function initializeWinston(): void {
  const { combine, timestamp, printf, colorize } = winston.format;

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const myFormat = printf(({ level, message, timestamp, data }) => {
    const formattedTimestamp = dayjs(timestamp).format(
      config.logging.timestampFormat,
    );

    let formatted = `${formattedTimestamp} | ${level}: ${message}`;
    if (bool(config.logging.logDataConsole) && data !== undefined) {
      formatted += `\n${JSON.stringify(data)}`;
    }

    return formatted;
  });

  const transports: Transport[] = [
    new winston.transports.Console({
      format: combine(
        myFormat,
        colorize({ all: true, colors: { debug: "brightBlue" } }),
      ),
    }),
    new SampleTransport(),
  ];
  if (config.instrumentation.enabled) {
    transports.push(new LokiTransport(config.instrumentation.lokiHost));
  }

  winston.configure({
    level: "debug",
    format: combine(timestamp(), myFormat),
    transports,
  });

}
