import * as Transport from "winston-transport";
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

    const attributes = {};
    for (const key in splat) {
      if (Object.prototype.hasOwnProperty.call(splat, key)) {
        attributes[key] = splat[key];
      }
    }
    this.logger.emit({
      body: info.message,
      severityNumber: getSeverityNumber(info.level),
      severityText: info.level,
      attributes: {
        ...attributes,
        // trace_id is not reliable under load, whereas traceId is
        trace_id: (attributes as any).traceId,
      },
      timestamp: new Date(info.timestamp)
    });
  }
}
