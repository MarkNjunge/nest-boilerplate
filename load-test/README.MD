# Load Tests

Load tests are written using [Grafana k6](https://grafana.com/oss/k6/).

Bundling is done using webpack to allow including npm modules.

## Usage

Install k6 https://grafana.com/docs/k6/latest/set-up/install-k6/

Run the test

```shell
npm run test:html
```

(optional)
Write to Prometheus
```shell
# Create a .env.prom file
cp .env.prom.sample .env.prom

# Run the test
npm run test:prom
```