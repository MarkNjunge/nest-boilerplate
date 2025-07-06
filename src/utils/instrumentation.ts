import { NodeSDK, NodeSDKConfiguration } from "@opentelemetry/sdk-node";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import * as logsAPI from "@opentelemetry/api-logs";
import { config } from "@/config";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace-node";

if (config.instrumentation.enabled.toString() === "true") {
  init();
}

function init() {
  if (config.instrumentation.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  }

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: config.appName,
    [ATTR_SERVICE_VERSION]: config.appVersion,
  });

  // Ignore certain urls from tracing
  const httpUrlIgnore = [];
  const httpUrlIgnoreRx = RegExp(httpUrlIgnore.join("|"));

  const configuration: Partial<NodeSDKConfiguration> = {
    sampler: new TraceIdRatioBasedSampler(config.instrumentation.sampleRatio),
    resource,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
        "@opentelemetry/instrumentation-nestjs-core": { enabled: true },
        "@opentelemetry/instrumentation-http": {
          enabled: true,
          ignoreOutgoingRequestHook: request => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return httpUrlIgnore.length > 0 ? httpUrlIgnoreRx.test(request.path!) : false;
          },
          ignoreIncomingRequestHook: request => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return httpUrlIgnore.length > 0 ? httpUrlIgnoreRx.test(request.url!) : false;
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
  };

  // Tracing
  if (config.instrumentation.tracing.enabled.toString() === "true") {
    configuration.traceExporter = new OTLPTraceExporter({ url: config.instrumentation.tracing.url });
  }

  // Metrics
  if (config.instrumentation.metrics.enabled.toString() === "true") {
    configuration.metricReader = new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: config.instrumentation.metrics.url }),
      exportIntervalMillis: 10000 // Default is 60_000
    });
  }

  // Logs
  if (config.instrumentation.logs.enabled.toString() === "true") {
    const loggerProvider = new LoggerProvider({ resource });
    const logExporter = new OTLPLogExporter({ url: config.instrumentation.logs.url });
    loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
    logsAPI.logs.setGlobalLoggerProvider(loggerProvider);
  }

  const sdk = new NodeSDK(configuration);

  sdk.start();
  console.log("Initialized instrumentation");
}
