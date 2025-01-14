import { NodeSDK } from "@opentelemetry/sdk-node";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import * as logsAPI from "@opentelemetry/api-logs";
import { config } from "@/config";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";

if (config.instrumentation.enabled.toString() === "true") {
  init();
}

function init() {
  if (config.instrumentation.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  }

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: "nest-boilerplate",
    [ATTR_SERVICE_VERSION]: "0.1.0",
  });
  const traceExporter = new OTLPTraceExporter({ url: config.instrumentation.traceUrl });
  const metricReader = new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: config.instrumentation.metricsUrl }),
    exportIntervalMillis: 10000, // Default is 60_000
  });

  const urlIgnorePaths = ["loki/api/v1/push"]; // Ignore POST request for Loki logs
  const rx = RegExp(urlIgnorePaths.join("|"));

  // Logs
  const loggerProvider = new LoggerProvider({ resource });
  const logExporter = new OTLPLogExporter({ url: config.instrumentation.logsUrl });
  loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
  logsAPI.logs.setGlobalLoggerProvider(loggerProvider);

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
        "@opentelemetry/instrumentation-nestjs-core": { enabled: true },
        "@opentelemetry/instrumentation-http": {
          enabled: true,
          ignoreOutgoingRequestHook: request => {
            return rx.test(request.path!);
          },
          ignoreIncomingRequestHook: request => {
            return rx.test(request.url!);
          }
        },
        "@opentelemetry/instrumentation-winston": {
          enabled: true, // Injects trace_id into logs
          disableLogSending: true, // Doesn't work even if enabled
        },
        "@opentelemetry/instrumentation-pg": { enabled: false }, // Already covered by knex
        "@opentelemetry/instrumentation-dns": { enabled: false },
        "@opentelemetry/instrumentation-net": { enabled: false }
      })
    ]
  });

  sdk.start();
}
