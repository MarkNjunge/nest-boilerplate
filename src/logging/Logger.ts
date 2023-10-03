import * as winston from "winston";
import { bool, config } from "../config";
import { FastifyRequest, FastifyReply } from "fastify";
import { SampleTransport } from "./Sample.transport";
import * as dayjs from "dayjs";
import { redact, clone } from "@/utils";
import { IReqCtx } from "@/decorators/request-context.decorator";

export class ILogMeta {
  tag?: string;

  data?: any;

  ctx?: IReqCtx;

  error?: Error;
}

export class Logger {
  constructor(private readonly name: string) {}

  info(message: string, meta?: ILogMeta): void {
    const tag = meta?.tag ?? this.name;
    winston.info({
      message: `[${tag}] ${message}`,
      data: Logger.getData(tag, message, meta),
    });
  }

  error(error: string | Error, meta?: ILogMeta): void {
    const tag = meta?.tag ?? this.name;
    const message = typeof error === "string" ? error : error.message;
    const data = Logger.getData(tag, message, meta);
    if ((error as Error).stack) {
      data.stacktrace = (error as Error).stack;
    }
    winston.error({ message: `[${tag}] ${message}`, data });
  }

  warn(message: string, meta?: ILogMeta): void {
    const tag = meta?.tag ?? this.name;
    winston.warn({
      message: `[${tag}] ${message}`,
      data: Logger.getData(tag, message, meta),
    });
  }

  debug(message: string, meta?: ILogMeta): void {
    const tag = meta?.tag ?? this.name;
    winston.debug({
      message: `[${tag}] ${message}`,
      data: Logger.getData(tag, message, meta),
    });
  }

  verbose(message: string, meta?: ILogMeta): void {
    const tag = meta?.tag ?? this.name;
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
    const correlationId = request.headers["x-correlation-id"] as string;
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

    this.info(message, { tag, data, ctx: { correlationId, ip } });
  }

  private static getData(tag: string, message: string, meta?: ILogMeta): any {
    const data = clone(meta?.data) ?? {};
    data.tag = tag;
    data.message = message;
    data.correlationId = meta?.ctx?.correlationId;
    data.ip = meta?.ctx?.ip;
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

  winston.configure({
    level: "debug",
    format: combine(timestamp(), myFormat),
    transports: [
      new SampleTransport(),
      new winston.transports.Console({
        format: combine(
          myFormat,
          colorize({ all: true, colors: { debug: "brightBlue" } }),
        ),
      }),
    ],
  });
}
