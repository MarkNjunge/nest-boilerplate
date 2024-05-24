import { NodeSDK } from "@opentelemetry/sdk-node";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { Resource } from "@opentelemetry/resources";
import {
  SEMRESATTRS_SERVICE_INSTANCE_ID,
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { config } from "@/config";

if (config.instrumentation.enabled.toString() === "true") {
  init();
}

function init() {
  if (config.instrumentation.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  }

  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: "nest-boilerplate",
    [SEMRESATTRS_SERVICE_VERSION]: "0.1.0",
    [SEMRESATTRS_SERVICE_INSTANCE_ID]: "instance-1",
  });
  const traceExporter = new OTLPTraceExporter({ url: config.instrumentation.traceUrl });
  const metricReader = new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: config.instrumentation.metricsUrl }),
    exportIntervalMillis: 10000, // Default is 60_000
  });

  const urlIgnorePaths = ["loki/api/v1/push"]; // Ignore POST request for Loki logs
  const rx = RegExp(urlIgnorePaths.join("|"));

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
          enabled: true,
          disableLogSending: true,
          logHook: (span, record) => {
            // Add attributes to data
            // record.data.attributes = (span as any).attributes;
          }
        },
        "@opentelemetry/instrumentation-pg": { enabled: false }, // Already covered by knex
        "@opentelemetry/instrumentation-dns": { enabled: false },
        "@opentelemetry/instrumentation-net": { enabled: false }
      })
    ]
  });

  sdk.start();
}
