# Observability

OpenTelemetry observability stack with Grafana
- OpenTelemetry Collector - Receive telemetry data from SDK
- Grafana - Dashboard
- Grafana Loki - Logs
- Grafana Tempo - Traces
- Prometheus - Metrics

## Signal Paths
Traces: `App -> Collector -> Temp -> Grafana`

Metrics: `App -> Collector -> Prometheus -> Grafana`

Logs: `App -> Logger -> Loki -> Grafana`


## Usage

Start the service
```
docker compose up -d
```

Open Grafana
http://localhost:9000
```
username: admin
password: admin
```

Data sources for Loki, Tempo and Prometheus are auto-configured.

Tempo is set up be able to navigate to Loki logs using a trace id.

## Endpoints
| Service           | Host                                |
|-------------------|:------------------------------------|
| Grafana Dashboard | http://localhost:9000               |
| OTel Collector    | http://localhost:55679/debug/tracez |
| Prometheues       | http://localhost:9090               |
| App Metrics       | http://localhost:8889/metrics       |
| Loki              | http://localhost:9100               |

