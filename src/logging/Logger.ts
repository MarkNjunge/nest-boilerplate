import * as winston from "winston";
import { bool, config } from "../config";
import { FastifyReply, FastifyRequest } from "fastify";
import { SampleTransport } from "./Sample.transport";
import * as dayjs from "dayjs";
import { clone, redact } from "@/utils";
import * as Transport from "winston-transport";
import { OtelTransport } from "@/logging/otel.transport";
import { AppClsStore, CLS_REQ_TIME } from "@/cls/app-cls";
import { ClsService, ClsServiceManager } from "nestjs-cls";
import opentelemetry from "@opentelemetry/api";

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

  traceId?: string;
}

export class Logger {
  private readonly clsService: ClsService<AppClsStore>;

  constructor(
    private readonly name: string,
  ) {
    this.clsService = ClsServiceManager.getClsService();
  }

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

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const requestTime = this.clsService.get()?.[CLS_REQ_TIME] ?? Date.now();
    const requestTimeISO = dayjs(requestTime).toISOString();
    const duration = dayjs().valueOf() - requestTime;

    const data = {
      tag,
      request: {
        url,
        method,
        requestTime: requestTimeISO,
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
    const activeSpan = opentelemetry.trace.getActiveSpan();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const traceId = meta.traceId ?? this.clsService.getId() ?? activeSpan?.spanContext().traceId ?? "00000";
    const obj: LogObject = {
      tag,
      traceId,
      message: `[${tag}] ${message}`,
      data: clone({
        ...(meta.data ?? {})
      }),
    };

    return redact(obj);
  }
}

export function initializeWinston(): void {
  const { combine, timestamp, printf, colorize } = winston.format;

  const myFormat = printf(({ level, message, timestamp, data }) => {
    const formattedTimestamp = dayjs(timestamp as string).format(
      config.logging.timestampFormat,
    );

    let formatted = `${formattedTimestamp} | ${level} | ${message}`;
    if (bool(config.logging.logDataConsole) && data !== undefined) {
      formatted += `\n${JSON.stringify(data, null, 2)}`;
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

  if (config.instrumentation.enabled.toString() === "true" && config.instrumentation.logs.enabled.toString() === "true") {
    transports.push(new OtelTransport(config));
  }

  winston.configure({
    level: "debug",
    format: combine(timestamp(), myFormat),
    transports,
  });
}
