import { NodeSDK, NodeSDKConfiguration } from "@opentelemetry/sdk-node";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import * as logsAPI from "@opentelemetry/api-logs";
import { config } from "@/config";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { Logger } from "@/logging/Logger";

const logger = new Logger("Instrumentation");

export function initInstrumentation() {
  if (config.instrumentation.enabled.toString() === "true") {
    const signals = {
      tracing: config.instrumentation.tracing.enabled.toString() === "true",
      metrics: config.instrumentation.metrics.enabled.toString() === "true",
      logs: config.instrumentation.logs.enabled.toString() === "true"
    };

    init(signals);
  }
}

function init(signals: { tracing: boolean; metrics: boolean; logs: boolean }) {
  if (config.instrumentation.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  }

  const resource = resourceFromAttributes({
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
        "@opentelemetry/instrumentation-pg": { enabled: true },
        "@opentelemetry/instrumentation-dns": { enabled: false },
        "@opentelemetry/instrumentation-net": { enabled: false }
      })
    ]
  };

  // Tracing
  if (signals.tracing) {
    configuration.traceExporter = new OTLPTraceExporter({ url: config.instrumentation.tracing.url });
  }

  // Metrics
  if (signals.metrics) {
    configuration.metricReader = new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: config.instrumentation.metrics.url }),
      exportIntervalMillis: 10000 // Default is 60_000
    });
  }

  // Logs
  if (signals.logs) {
    const logExporter = new OTLPLogExporter({ url: config.instrumentation.logs.url });
    const loggerProvider = new LoggerProvider({
      resource,
      processors: [
        new BatchLogRecordProcessor(logExporter)
      ]
    });
    logsAPI.logs.setGlobalLoggerProvider(loggerProvider);
  }

  const sdk = new NodeSDK(configuration);

  sdk.start();
  logger.info(`Initialized instrumentation: ${JSON.stringify(signals)}`);
}
