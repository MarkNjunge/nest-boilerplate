import Transport from "winston-transport";
import * as logsAPI from "@opentelemetry/api-logs";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { Config } from "@/config";

const npmLevels: Record<string, number> = {
  error: SeverityNumber.ERROR,
  warn: SeverityNumber.WARN,
  info: SeverityNumber.INFO,
  http: SeverityNumber.DEBUG3,
  verbose: SeverityNumber.DEBUG2,
  debug: SeverityNumber.DEBUG,
  silly: SeverityNumber.TRACE,
};

const sysLoglevels: Record<string, number> = {
  emerg: SeverityNumber.FATAL3,
  alert: SeverityNumber.FATAL2,
  crit: SeverityNumber.FATAL,
  error: SeverityNumber.ERROR,
  warning: SeverityNumber.WARN,
  notice: SeverityNumber.INFO2,
  info: SeverityNumber.INFO,
  debug: SeverityNumber.DEBUG,
};

const cliLevels: Record<string, number> = {
  error: SeverityNumber.ERROR,
  warn: SeverityNumber.WARN,
  help: SeverityNumber.INFO3,
  data: SeverityNumber.INFO2,
  info: SeverityNumber.INFO,
  debug: SeverityNumber.DEBUG,
  prompt: SeverityNumber.TRACE4,
  verbose: SeverityNumber.TRACE3,
  input: SeverityNumber.TRACE2,
  silly: SeverityNumber.TRACE,
};

function getSeverityNumber(level: string): SeverityNumber | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return npmLevels[level] ?? sysLoglevels[level] ?? cliLevels[level];
}

/**
 * @see https://github.com/open-telemetry/opentelemetry-js-contrib/blob/3dfc7e33c3ef65770822d8ec02c8d58e90caceb2/packages/winston-transport/src/OpenTelemetryTransportV3.ts
 */
export class OtelTransport extends Transport {

  private logger: logsAPI.Logger;


  constructor(protected readonly config: Config) {
    super({});
    this.logger = logsAPI.logs.getLogger(config.appName);
  }

  log(info: any, callback: () => void): void {
    setImmediate(callback);

    // message and level are excluded from the rest
    const { message, level, ...splat } = info;

    if (this.config.instrumentation.logs.logData.toString() !== "true") {
      delete splat.data;
    }

    if (this.config.instrumentation.logs.logRequestData.toString() !== "true") {
      delete splat.data?.request?.headers;
      delete splat.data?.request?.query;
      delete splat.data?.request?.body;
    }
    if (this.config.instrumentation.logs.logResponseData.toString() !== "true") {
      delete splat.data?.response?.headers;
      delete splat.data?.response?.body;
    }

    let attributes: Record<string, any> = {};
    for (const key in splat) {
      if (Object.prototype.hasOwnProperty.call(splat, key)) {
        attributes[key] = splat[key];
        if (key === "data") {
          attributes = {
            ...attributes,
            ...flattenObject({ data: attributes[key] })
          };
          delete attributes.data;
        }
      }
    }
    this.logger.emit({
      body: info.message,
      severityNumber: getSeverityNumber(info.level),
      severityText: info.level,
      attributes: {
        ...attributes,
        // trace_id is not reliable under load, whereas traceId is
        trace_id: attributes.traceId,
      },
      timestamp: new Date(info.timestamp)
    });
  }
}

type FlattenedObject = Record<string, unknown>;

function isPlainTraversable(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  if (value instanceof Date) return false;
  if (value instanceof RegExp) return false;
  if (value instanceof Map || value instanceof Set) return false;
  if (ArrayBuffer.isView(value)) return false;
  return true;
}

function transformLeaf(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) && value.length === 0) return JSON.stringify(value);
  if (
    isPlainTraversable(value) &&
    Object.keys(value).length === 0
  ) {
    return JSON.stringify(value);
  }
  return value;
}

function flattenObject(
  obj: unknown,
  prefix = "",
  separator = "."
): FlattenedObject {
  const result: FlattenedObject = {};

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      result[prefix] = JSON.stringify(obj);
      return result;
    }
    obj.forEach((item, index) => {
      const newKey = prefix ? `${prefix}${separator}${index}` : String(index);
      if (isPlainTraversable(item) || Array.isArray(item)) {
        Object.assign(result, flattenObject(item, newKey, separator));
      } else {
        result[newKey] = transformLeaf(item);
      }
    });
    return result;
  }

  if (!isPlainTraversable(obj)) {
    if (prefix) result[prefix] = transformLeaf(obj);
    return result;
  }

  const keys = Object.keys(obj);
  if (keys.length === 0 && prefix) {
    result[prefix] = JSON.stringify(obj);
    return result;
  }

  for (const key of keys) {
    const newKey = prefix ? `${prefix}${separator}${key}` : key;
    const value = obj[key];

    if (isPlainTraversable(value) || Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey, separator));
    } else {
      result[newKey] = transformLeaf(value);
    }
  }

  return result;
}
