# Load Tests

Load tests using [Artillery](https://www.artillery.io/).

## Running

```bash
npm install
npm run test:validation
```

After the test completes, an HTML report is automatically generated at `report.html`.

### Environment Variables

| Variable   | Default                  | Description              |
|------------|--------------------------|--------------------------|
| `API_HOST` | `http://localhost:3000`  | Target API base URL      |
| `API_KEY`  | `api-key`                | Bearer token for auth    |
| `LOAD_TYPE`| `validation`             | Environment profile name |

```bash
API_HOST=https://staging.example.com API_KEY=secret npm run test:spike
```

## Scripts

| Script              | Description                                                                       |
|---------------------|-----------------------------------------------------------------------------------|
| `test`              | Run load test (uses `LOAD_TYPE` env, default `validation`) and generates a report |
| `test:validation`   | Quick validation run (10s, 2 req/s)                                               |
| `test:spike`        | Spike test — ramp to 150 req/s                                                    |
| `test:soak`         | Soak test — 10min steady state at 50 req/s                                        |
| `test:crud-only`    | Run only the "User CRUD lifecycle" scenario                                       |
| `test:browse-only`  | Run only the "Browse users" scenario                                              |
| `test:search-only`  | Run only the "User search" scenario                                               |
| `report`            | Generate `report.html` from `report.json`                                         |
| `template:dev`      | Live-reload server for developing the report template                             |

## Environments

Environments are defined in `test.yml` under `config.environments`. Each overrides the default `phases`.

### validation

Quick smoke test to verify the API is working.

- **Duration:** 10s
- **Arrival rate:** 2 req/s
- **Max VUsers:** 5

### spike

Simulates a traffic spike to test how the API handles sudden load.

| Phase          | Duration | Rate       |
|----------------|----------|------------|
| Warm up        | 30s      | 5 req/s    |
| Ramp to 100    | 45s      | 5 → 100    |
| Spike to 150   | 20s      | 100 → 150  |
| Sustain        | 60s      | 150 req/s  |
| Cool down      | 30s      | 150 → 5    |

### soak

Sustained load over a longer period to detect memory leaks, connection pool exhaustion, etc.

| Phase     | Duration | Rate      |
|-----------|----------|-----------|
| Ramp up   | 60s      | 1 → 50   |
| Steady    | 10min    | 50 req/s  |
| Cool down | 60s      | 50 → 1   |

## Scenarios

Scenarios are defined in `test.yml` under `scenarios`. Each virtual user runs one scenario, selected by weight.

### User CRUD lifecycle (weight: 6, ~60%)

Full write path: create a user → search for them → update → delete.

Uses the `generateUserData` processor function to generate fake user data, and `checkSearchResult` to validate the search response.

### Browse users (weight: 3, ~30%)

Read-heavy browsing: paginated list queries with sorting and field selection.

### User search (weight: 1, ~10%)

Count endpoint + filtered searches by username (ilike) and creation date.

Uses the `generateSearchData` processor function to generate random search terms and dates.

## Report

After each test run, Artillery writes `report.json`. The `report` script runs `generate-report.ts`, which injects the JSON data into `template.html` to produce a self-contained `report.html` file.

### Files

- **`template.html`** — Vue 3 + Chart.js + Tailwind CSS dashboard. Reads data from `window.__ARTILLERY_REPORT__`.
- **`generate-report.ts`** — Replaces the `null` placeholder in the template with the actual JSON data.

### Generating manually

```bash
npm run report                                          # default: report.json → report.html
npm run report -- --json custom.json --output out.html  # custom paths
```

### Developing the template

The template falls back to fetching `report.json` via `fetch()` when no data is injected, so it can be served directly for development.

```bash
npm run template:dev
```

This starts a live-reload server. Edit `template.html` and the browser refreshes automatically. Requires a `report.json` file in the directory (run a test first or use an existing one).

## Extending

### Adding an environment

1. Add a new entry under `config.environments` in `test.yml`:

```yaml
environments:
  stress:
    phases:
      - name: Ramp up
        duration: 60
        arrivalRate: 10
        rampTo: 200
      - name: Hold
        duration: 120
        arrivalRate: 200
```

2. Optionally add a convenience script to `package.json`:

```json
"test:stress": "LOAD_TYPE=stress npm test"
```

3. Run it:

```bash
npm run test:stress
# or
LOAD_TYPE=stress npm test
```

### Adding a scenario

1. Add a new scenario under `scenarios` in `test.yml`:

```yaml
- name: Health check
  weight: 1
  flow:
    - get:
        url: /ready
        expect:
          - statusCode: 200
```

2. If the scenario needs dynamic data, add a processor function to `processor.ts`:

```typescript
export function generateMyData(
  context: ArtilleryContext,
  _events: unknown,
  done: () => void,
): void {
  context.vars.myVar = "value";
  done();
}
```

Then reference it in the scenario:

```yaml
- name: My scenario
  weight: 2
  beforeScenario: generateMyData
  flow:
    - get:
        url: "/endpoint?param={{ myVar }}"
```

3. Optionally add a script to run the scenario in isolation:

```json
"test:health-only": "SCENARIO='Health check' npm run test:scenario"
```

## Processor

`processor.ts` contains Artillery hook functions:

| Function             | Hook               | Purpose                                                    |
|----------------------|--------------------|------------------------------------------------------------|
| `generateUserData`   | `beforeScenario`   | Generates fake username, email, and updated username       |
| `generateSearchData` | `beforeScenario`   | Generates a random 3-char search term and a recent date    |
| `checkSearchResult`  | `afterResponse`    | Validates that the search API returned the expected user   |
