import * as winston from "winston";
import { bool, config } from "../config";
import { FastifyRequest, FastifyReply } from "fastify";
import { SampleTransport } from "./Sample.transport";
import * as dayjs from "dayjs";
import { redact, clone } from "@/utils";
import * as Transport from "winston-transport";
import { OtelTransport } from "@/logging/otel.transport";

export class ILogMeta {
  // A tag indicating what this error relates to. Usually based on the stack.
  tag?: string;

  // Explicit traceId if instrumentation does not inject it
  traceId?: string;

  // Extra data
  data?: any;
}

interface LogObject {
  tag: string;
  message: string;
  data: any;
  stacktrace?: string;

  trace_id?: string;
}

export class Logger {
  constructor(private readonly name: string) {}

  info(message: string, meta: ILogMeta = {}): void {
    winston.info(this.getLogObject(message, meta));
  }

  error(message: string, meta: ILogMeta = {}, error?: Error): void {
    const logObject = this.getLogObject(message, meta);
    if (error?.stack) {
      logObject.stacktrace = error.stack;
    }
    winston.error(logObject);
  }

  warn(message: string, meta: ILogMeta = {}): void {
    winston.warn(this.getLogObject(message, meta));
  }

  debug(message: string, meta: ILogMeta = {}): void {
    winston.debug(this.getLogObject(message, meta));
  }

  verbose(message: string, meta: ILogMeta = {}): void {
    winston.verbose(this.getLogObject(message, meta));
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

  private getLogObject(message: string, meta: ILogMeta): LogObject {
    const tag = meta.tag ?? this.name;
    const obj: LogObject = {
      tag,
      message: `[${tag}] ${message}`,
      data: clone(meta.data ?? {})
    };

    if (meta.traceId) {
      obj.trace_id = meta.traceId;
    }

    return redact(obj);
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
    transports.push(new OtelTransport(config));
  }

  winston.configure({
    level: "debug",
    format: combine(timestamp(), myFormat),
    transports,
  });

}
