# Observability

OpenTelemetry observability stack with Grafana

- OpenTelemetry Collector - Receive telemetry data from SDK
- Grafana - Dashboard
- Grafana Loki - Logs
- Grafana Tempo - Traces
- Prometheus - Metrics

## Signal Paths

Traces: `App -> Collector -> Tempo -> Grafana`

Metrics: `App -> Collector -> Prometheus -> Grafana`

Logs: `App -> Collector -> Loki -> Grafana`

## Usage

Start the monitoring services

```
docker compose up -d
```

Enable instrumentation in the config

```json
{
  "instrumentation": {
    "enabled": true
  }
}
```

Open Grafana
http://localhost:9000/explore

Data sources for Loki, Tempo and Prometheus are auto-configured.

[Trace to logs](https://grafana.com/docs/grafana/next/datasources/tempo/configure-tempo-data-source/#trace-to-logs)
is configured in Tempo.

<img height="522" src=".\img\2025-01-15_14-41-36.png" width="1100"/>

<img height="522" src=".\img\2025-01-15_14-40-47.gif" width="1100"/>
