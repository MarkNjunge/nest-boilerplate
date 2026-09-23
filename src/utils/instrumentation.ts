import { NodeSDK, NodeSDKConfiguration } from "@opentelemetry/sdk-node";
import { diag, DiagConsoleLogger, DiagLogLevel, trace } from "@opentelemetry/api";
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

let sdkInstance: NodeSDK | null = null;
let loggerProviderInstance: LoggerProvider | null = null;

function initInstrumentation() {
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
  const httpUrlIgnore: string[] = [];
  const httpUrlIgnoreRx = RegExp(httpUrlIgnore.join("|"));

  const configuration: Partial<NodeSDKConfiguration> = {
    sampler: new TraceIdRatioBasedSampler(config.instrumentation.sampleRatio),
    resource,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
        // A new package will likely be introduced
        // https://github.com/open-telemetry/opentelemetry-js-contrib/pull/3435
        "@opentelemetry/instrumentation-nestjs-core": { enabled: true },
        "@opentelemetry/instrumentation-http": {
          enabled: true,
          ignoreOutgoingRequestHook: request => {
            return httpUrlIgnore.length > 0 ? httpUrlIgnoreRx.test(request.path!) : false;
          },
          ignoreIncomingRequestHook: request => {
            return httpUrlIgnore.length > 0 ? httpUrlIgnoreRx.test(request.url!) : false;
          }
        },
        // Log correlation is handled manually by capturing the active Context
        // at the log call site (src/logging/Logger.ts) and passing it explicitly
        // to Logger.emit() (src/logging/otel.transport.ts). This instrumentation's
        // own correlation patches Logger.prototype.write and reads context.active()
        // at winston's internal flush time, which is unreliable under load since
        // winston's write queue can back up and flush later, in a different
        // request's async context. Log sending is also handled manually via
        // OtelTransport, so this instrumentation has nothing correct left to do.
        "@opentelemetry/instrumentation-winston": { enabled: false },
        "@opentelemetry/instrumentation-pg": { enabled: true },
        "@opentelemetry/instrumentation-dns": { enabled: false },
        "@opentelemetry/instrumentation-net": { enabled: false }
      })
    ]
  };

  // Tracing
  if (signals.tracing) {
    configuration.traceExporter = new OTLPTraceExporter({ url: config.instrumentation.tracing.url });
    // fastifyOtelInstrumentation.setTracerProvider(trace.getTracerProvider());
  }

  // Metrics
  if (signals.metrics) {
    configuration.metricReaders = [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({ url: config.instrumentation.metrics.url }),
        exportTimeoutMillis: 10000, // Clamped to export interval
        exportIntervalMillis: 10000 // Default is 60_000
      })
    ];
  }

  // Logs
  if (signals.logs) {
    const logExporter = new OTLPLogExporter({ url: config.instrumentation.logs.url });
    loggerProviderInstance = new LoggerProvider({
      resource,
      processors: [
        new BatchLogRecordProcessor({ exporter: logExporter })
      ]
    });
    logsAPI.logs.setGlobalLoggerProvider(loggerProviderInstance);
  }

  sdkInstance = new NodeSDK(configuration);
  sdkInstance.start();
  console.log(`Initialized instrumentation: ${JSON.stringify(signals)}`);
}

// Must be initialized at import time, before @nestjs/platform-fastify
initInstrumentation();

export async function flushInstrumentation() {
  if (sdkInstance) {
    await sdkInstance.shutdown();
  }

  if (loggerProviderInstance) {
    await loggerProviderInstance.forceFlush();
  }
}
