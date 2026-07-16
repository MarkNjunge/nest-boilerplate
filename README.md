# Nest Starter

[![CI](https://github.com/MarkNjunge/nest-boilerplate/workflows/Main%20Workflow/badge.svg)](https://github.com/MarkNjunge/nest-boilerplate/actions/workflows/main-workflow.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/MarkNjunge/nest-boilerplate/badge.svg)](https://snyk.io/test/github/MarkNjunge/nest-boilerplate)

A boilerplate for [NestJS](https://nestjs.com/) using Fastify, designed to give you a production-ready foundation with
batteries included - covering authentication, database access with a full CRUD layer, request validation, observability,
and more.

## Quick Start

### Pre-requisites

- [Node.js](https://nodejs.org/) (v24+)
- PostgreSQL (or use the Docker Compose setup below)
- Redis (or use the Docker Compose setup below)

For a first start, the easiest way is to use Docker Compose, which starts both PostgreSQL and Redis:

```bash
docker compose up -d db redis
```

Then create a `local.json` in `config/` with your database and Redis URLs (or set the `DB_URL` and `REDIS_URL`
environment variables).

### Install & Run

```bash
npm install
```

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Features

- **Configuration** - Layered config via `node-config` with support for env vars, `.env` files, and external secrets
  managers.
- **Authentication** - Bearer token auth with a guard-based pattern, integrated into the request context.
- **User Scoping** - Automatic per-user data isolation: entities extend `UserScopedEntity` and all queries
  are transparently filtered by the authenticated user's ID. Pass `userScoped: false` in the context to bypass
  for a single call (public feeds, admin actions).
- **Database** - TypeORM with migrations, a full CRUD service/controller inheritance layer, and a codegen
  tool to scaffold new resources.
- **Caching** - Redis-backed `CacheService` with key prefixing, JSON serialization, and
  generation-based invalidation for CRUD services via `CrudCacheService`.
- **Query Parsing** - URL query parameters mapped to DB queries, supporting field selection, filtering, sorting,
  pagination, and relation loading.
- **Transactions** - Reusable transaction wrapper for atomic multi-entity operations with configurable isolation levels.
- **API & Documentation** - File uploads, rate limiting, request body validation, response mapping, structured error
  handling, and auto-generated Swagger docs.
- **Observability** - Structured logging via Winston, request context (trace IDs), health check endpoints, and full
  OpenTelemetry support for traces, metrics, and logs.
- **Testing** - Unit, integration, end-to-end (Docker), and load tests (Artillery).
- **Docker & CI** - Dockerfile, Docker Compose, and GitHub Actions workflow included.

## Configuration

The [node-config](https://www.npmjs.com/package/config) package is used to manage configs.

Default config values are found in [default.json](./config/default.json).  
These values can be overridden by:

- Creating config files as described
  in [node-config docs](https://github.com/node-config/node-config/wiki/Configuration-Files)
- Creating a `local.json` file in _config/_
- Creating a `.env` file in the project directory.
- Setting environment variables - see mappings
  in [custom-environment-variables.json](./config/custom-environment-variables.json)

### Secrets Manager

For loading secrets from external sources (e.g., AWS Secrets Manager, HashiCorp Vault), implement the `loadSecrets()`
function in [secrets-manager.ts](./src/config/secrets-manager.ts).

The function is called during application startup and its return value is deep-merged with the base config, allowing
secrets to override any config values.

```typescript
// src/config/secrets-manager.ts
export async function loadSecrets(): Promise<any> {
  // Example: Load from Secrets Manager
  const secrets = await getSecrets(process.env.SECRETS_TOKEN);
  return {
    db: {
      url: secrets.DATABASE_URL,
    },
    apiKey: secrets.API_KEY,
  };
}
```

The secrets are loaded before application modules are initialized, ensuring all services have access to the complete
configuration.

## Authentication

A simple authentication pattern is implemented using a modular service-based approach:

- **AuthGuard** (`src/guards/auth.guard.ts`) - Applied globally; extracts the Bearer token, validates it via
  `AuthValidator`, and stores the result in the request context (ALS)
- **AuthValidator** (`src/guards/auth.validator.ts`) - Abstract class used by `AuthGuard` to validate tokens.
- **AuthService** (`src/modules/auth/auth.service.ts`) - Validates tokens.

All routes require a valid Bearer token except `/`, `/ready`, and `/live`.

To implement authentication, extend the `AuthService`:
- `validateUser(token)` — return an `AuthenticatedUser` (containing `userId`) for valid user tokens, or `null` to reject
- `validateAdmin(token)` — return `true` for valid admin tokens, or `false` to reject. By default, this checks against
  `auth.adminKey` in config.

### Auth Modes

Auth modes are **arbitrary** metadata that control what kind of authentication a route requires. It is used by
`AuthGuard`.

The `@AuthMode` decorator can be applied directly to individual controller methods:

```typescript
import { AuthMode } from "@/guards/auth.validator";

@AuthMode("ADMIN")
@Delete("/:id")
deleteById(...) { ... }
```

The crud library has its own pattern for auth modes. See `src/lib/crud/README.md`.

### Accessing the Authenticated User

Use the `@ReqCtx()` decorator to access the authenticated user:

```typescript
@Get()
handler(@ReqCtx() ctx: IReqCtx) {
  console.log(ctx.traceId);  // Request trace ID
  console.log(ctx.user);     // { userId: "usr_..." }
  console.log(ctx.isAdmin);  // true if authenticated as admin
}
```

The `IReqCtx` interface provides:

- `traceId: string` - Request trace ID for logging/debugging
- `user?: AuthenticatedUser` - Authenticated user info (set for user-mode auth)
- `isAdmin?: boolean` - Set to `true` when the request was authenticated via admin mode

## Database

[TypeORM](https://typeorm.io) is used for the database.

### Migrations

Schema changes require migrations.

Migrations can be **generated** using:

```bash
npm run migration generate migration_name
```

Alternatively, empty migration files can be created using:

```bash
npm run migration create migration_name
```

When the server starts, migrations will run automatically, controlled by the config `db.runMigrations`;

Alternatively, they can be run outside server startup:

```bash
npm run migration up
```

To revert the last migration:

```bash
npm run migration down
```

### CRUD Layer

> For complete details, see [@src/lib/crud/README.md](src/lib/crud/README.md)

The database layer uses inheritance to separate read and write operations:

**Base Entities:**

- [BaseEntity](src/lib/crud/entity/base.entity.ts) - Provides `id` generation as well as `createdAt`, `updatedAt`
  management.
- [UserScopedEntity](src/lib/crud/entity/user-scoped.entity.ts) - Extends `BaseEntity` with a `userId` column and a
  `@ManyToOne` relation to `User`. Entities that extend this are automatically filtered by the authenticated user's ID
  on all reads and writes.

**Services:**

- [BaseService](src/lib/crud/service/base.service.ts) - Read-only operations (`count`, `list`, `get`, `getById`).
  Accepts a `ServiceOptions` object; set `userScoped: false` for global resources that should not be filtered by user.
  Pass `userScoped: false` in `ICrudContext` to bypass scoping for a single call (e.g. a public feed or admin action).
- [CrudService](src/lib/crud/service/crud.service.ts) - Extends BaseService with write operations (`create`, `update`,
  `delete`, etc.). Automatically injects `userId` from context on create and scopes updates/deletes to the current user.
- [CrudCacheService](src/lib/crud/service/crud-cache.service.ts) - Extends CrudService with automatic caching. See
  [CrudCacheService docs](src/lib/crud/README.md#crudcacheservice) for full documentation.

**Controllers:**

- [BaseController](src/lib/crud/controller/base.controller.ts) - Read-only endpoints
- [CrudController](src/lib/crud/controller/crud.controller.ts) - Extends BaseController with write endpoints

Use `BaseService`/`BaseController` for read-only access, `CrudService`/`CrudController` for full CRUD.

#### Codegen

A generator can be used to scaffold the CRUD layer:

```shell
npm run codegen
```

The command will:

1. Create a model
2. Create a Service (optional)
3. Create a Controller (optional)
4. Create a Module (if a service or controller was created)

After this you should:

1. Add fields to the created model, create dto and update dto.
2. Run `npm run migration generate migration_name` to create the migration.

#### Route Exclusion

Both controller factory functions accept an optional `options` parameter with an `exclude` array to skip specific
routes:

```typescript
// BaseController - skip specific read-only routes
BaseController(entityType, { exclude: ["listCursor"] })

// CrudController - skip any base or crud route
CrudController(entityType, CreateDto, UpdateDto, { exclude: ["listCursor", "createBulk"] })
```

Excluded methods are removed from the controller prototype, so NestJS never registers them as routes.

#### Auth Configuration

The `options` parameter also accepts an `auth` field to configure authentication for the controller:

| Value                                  | Behaviour                                               |
|----------------------------------------|---------------------------------------------------------|
| _(omitted)_                            | All routes require user auth (default)                  |
| `{ mode: "ADMIN" }`                    | All routes require admin auth                           |
| `{ publicReads: true }`                | Read routes are public; write routes require user auth  |
| `{ publicReads: true, mode: "ADMIN" }` | Read routes are public; write routes require admin auth |
| `false`                                | Auth guard is not applied to any route                  |

```typescript
// Admin-only controller
CrudController(entityType, CreateDto, UpdateDto, { auth: { mode: "ADMIN" } })

// Public read, admin-protected writes
CrudController(entityType, CreateDto, UpdateDto, { auth: { publicReads: true, mode: "ADMIN" } })
```

### Transactions

[TransactionService](src/lib/crud/transaction/transaction.service.ts) provides a reusable wrapper around TypeORM's
`DataSource.transaction()` for atomic multi-entity operations.

Use `TransactionService.run()` combined with `withTransaction(manager)` on any `BaseService`/`CrudService` subclass:

```typescript
async
createPostWithComment(dto: CreatePostWithCommentDto): Promise<Post> {
  return this.transactionService.run(async manager => {
    const txPostService = this.withTransaction(manager);
    const txCommentService = this.commentService.withTransaction(manager);

    const post = await txPostService.create({ ... });
    const comment = await txCommentService.create({ ..., postId: post.id });

    return Object.assign(post, { comments: [comment] });
  });
}
```

`withTransaction(manager)` returns a lightweight clone of the service that uses a transaction-scoped repository. All
existing service methods work on the clone without modification. On error, the transaction is automatically rolled back.

Available levels: `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`.

## Caching

A Redis-backed caching layer is provided via [CacheService](src/modules/_cache/cache.service.ts).

### CacheService

`CacheService` wraps a Redis client with automatic key prefixing (configured via `config.redis.keyPrefix`) and
OpenTelemetry metrics instrumentation.

Optional command logging is available via `config.redis.logCommands`.

All methods gracefully handle Redis errors.

The service implements `OnModuleDestroy` to cleanly close the Redis connection on shutdown.

### CRUD Caching

For caching CRUD read operations with automatic invalidation, the `CrudCacheService` in the CRUD library
handles this. See [CrudCacheService](src/lib/crud/README.md#crudcacheservice) for full documentation.

## API & Documentation

### Query Parsing

The CRUD layer exposes a query system that converts standard URL query parameters into TypeORM database queries. This
system is available on all list and cursor endpoints.

> For the full implementation details and advanced usage,
> see [src/lib/crud/README.md](src/lib/crud/README.md#query-system).

#### Query Parameters

| Parameter | Description                                                                                                                      |
|-----------|----------------------------------------------------------------------------------------------------------------------------------|
| `select`  | Comma-separated field names to return (supports dot-notation for nested relations, e.g. `title,comments.content,user.username`)  |
| `include` | Comma-separated relation names to eager-load (supports dot-notation for nested relations, e.g. `comments,user,user.profile`)     |
| `filter`  | Filter expressions in `(field,operator,value)` format, colon-separated for multiple filters                                      |
| `sort`    | Sort expressions in `(field,direction)` format, colon-separated for multiple columns; supports dot-notation for nested relations |
| `limit`   | Number of results to return (default: `20`, max: `99`)                                                                           |
| `offset`  | Number of results to skip (offset pagination only)                                                                               |

#### Filter Syntax

Filters use the format `(field,operator,value)`. Multiple filters are separated by colons:

```
filter=(title,eq,Hello World):(createdAt,gt,2025-01-01)
```

Array-style operators (`in`, `notin`) use a pipe separator for values:

```
filter=(id,in,id1|id2|id3)
```

For range operators (`between`, `notbetween`), a second value is implied:

```
filter=(price,between,100,500)
```

Supported filter operators: `eq`, `ne`, `like`, `ilike`, `gt`, `lt`, `gte`, `lte`, `in`, `notin`, `isnull`, `isnotnull`, 
`between`, `notbetween`, `any`, `none`, `contains`, `containedby`.

#### Examples

**Basic list with field selection:**

```
GET /posts?select=title,content&limit=10
```

**Filter by field:**

```
GET /posts?filter=(title,eq,Hello)
```

**Filter with in operator:**

```
GET /posts?filter=(id,in,post_01|post_02|post_03)
```

**Sort by multiple fields:**

```
GET /posts?sort=(createdAt,DESC):(title,ASC)
```

**Nested relation selection:**

```
GET /posts?select=title,comments.content,comments.user.username&include=comments,comments.user
```

**Combined filter + sort + pagination:**

```
GET /posts?filter=(published,eq,true)&sort=(createdAt,DESC)&limit=15&offset=30
```

### File Upload

See [AppController](src/modules/app/app.controller.ts) for a sample implementation.

**Config:**

`maxSize: number` - Max size in bytes. Default 5MB.  
`uploadDir: string` - Upload directory. If blank, defaults to the OS's temp directory.  
`removeAfterUpload: boolean` - Whether to delete files after the request completes.

### Rate Limiting

A rate limiter is configured using [@nestjs/throttler](https://github.com/nestjs/throttler).

The implementation is left as the default. See [Nestjs Docs](https://docs.nestjs.com/security/rate-limiting).

**Config:**

| Key                    | Description                  | Default |
|------------------------|------------------------------|---------|
| `rateLimit.enabled`    | Enable/disable rate limiting | `true`  |
| `rateLimit.max`        | Max requests per time window | `100`   |
| `rateLimit.timeWindow` | Time window in seconds       | `60`    |

### Request Body Validation

[class-validator](https://www.npmjs.com/package/class-validator)
and [class-transformer](https://www.npmjs.com/package/class-transformer) are used to validate request bodies.

See [class-validator decorators](https://www.npmjs.com/package/class-validator#validation-decorators) for available
validation options.

An example response to an invalid body:

```json
{
  "status": 400,
  "message": "Validation errors with properties [name,username,contact.mail,contact.email]",
  "code": "ValidationError",
  "meta": [
    {
      "property": "name",
      "constraints": [
        "property name should not exist"
      ]
    },
    {
      "property": "username",
      "constraints": [
        "username should not be empty"
      ]
    },
    {
      "property": "contact.mail",
      "constraints": [
        "property mail should not exist"
      ]
    },
    {
      "property": "contact.email",
      "constraints": [
        "email should not be empty"
      ]
    }
  ]
}
```

> Raising an error when unknown values are passed can be disabled by setting `validator.forbidUnknown` to `false` in the
> config.

### Response Mapping

Cleaning response objects can be enabled using the `@Serialize(ClassName)` decorator. It
uses [class-transformer](https://www.npmjs.com/package/class-transformer).

### Errors & Exception Handling

All request exceptions are caught by [all-exceptions.filter.ts](`src/filters/all-exceptions.filter.ts`).

Exceptions should be thrown using the **custom** [HttpException](src/utils/HttpException.ts) class.

```typescript
throw new HttpException(404, `User ${1} was not found`, ErrorCodes.INVALID_USER, { id: 1 });
```

```json
{
  "status": 404,
  "message": "User 1 was not found",
  "code": "InvalidUser",
  "traceId": "775523bae019485d",
  "meta": {
    "id": 1
  }
}
```

Regular errors and unhandled exceptions are also caught and returned as a 500 response.

```json
{
  "status": 500,
  "message": "Uncaught exception",
  "code": "InternalError",
  "traceId": "d3cb1b2b3388e3b1"
}
```

### Swagger

Swagger documentation is automatically generated from the routes.

By default, it is available at http://127.0.0.1:3000/docs

**Config:**

| Key                | Description            | Default |
|--------------------|------------------------|---------|
| `swagger.enabled`  | Enable/disable Swagger | `true`  |
| `swagger.endpoint` | Swagger UI path        | `docs`  |

## Observability

### Logging

[Winston](https://www.npmjs.com/package/winston) is used as the logging library.

Create a logger instance using `new Logger()`. A parameter can be passed into the constructor to be used as a tag (
defaults to `"Application"`).

```typescript
import { Logger } from "@/logging/Logger";

const logger = new Logger("AppService");
```

```typescript
this.logger.debug("Hello!");
// 2019-05-10 19:47:21.570 | debug: [AppService] Hello!
```

A custom tag can be passed into the log functions:

```typescript
this.logger.debug("Hello!", { tag: "AppService.getHello" });
// 2019-05-10 19:54:43.062 | debug: [AppService.getHello] Hello!
```

Extra data can be passed into the log functions. To enable printing it to the console, set `logging.logDataConsole` to
`true` in the config.

```typescript
this.logger.debug(`Hello ${ctx.traceId}`, { data: { traceId: ctx.traceId } });
// 2025-01-15 15:11:57.090 | debug: [AppService.getHello] Hello 47e4a86ea7c0676916b45bed6c80d1bb
// {
//   "traceId": "47e4a86ea7c0676916b45bed6c80d1bb"
// }
```

#### Custom Transports

See [SampleTransport](src/logging/Sample.transport.ts) for an example.

#### Redact Private Keys

Private keys are automatically redacted in logged data. The private keys are specified
in [redact.ts](src/utils/redact.ts).

```json
{
  "username": "mark",
  "contact": {
    "email": "REDACTED"
  }
}
```

### Request Context

Node's built-in `AsyncLocalStorage` is used to maintain request state via a custom `AppAlsModule`.

The request ID is the trace ID if observability is enabled, otherwise it's a random string prefixed with `ctx_`. It can
be accessed by injecting `AppAlsService`.

```typescript
class Service {
  constructor(
    private readonly alsService: AppAlsService
  ) {
  }

  handler() {
    this.alsService.getId();
  }
}
```

To get the authenticated user, use `alsService.get(ALS_AUTH_USER)`:

```typescript
class Service {
  constructor(private readonly alsService: AppAlsService) {}

  handler() {
    const user = this.alsService.get(ALS_AUTH_USER); // AuthenticatedUser | undefined
  }
}
```

Alternatively, `@ReqCtx()` can be used in controllers to access both the trace ID and the authenticated user:

```typescript
class Controller {
  @Get()
  getHello(@ReqCtx() ctx: IReqCtx) {
    console.log(ctx.traceId) // 0d8df9931b05fbcd2262bc696a1410a6
    console.log(ctx.user)    // { userId: "usr_..." } | undefined
  }
}
```

> Note: traceId is automatically injected into logs, accessible via a custom transport.

### Health Check

Health check endpoints are set up at `/live` and `/ready`.

#### `/live`

A simple liveness check that always returns `200 OK` (provided the server is running).

```json
{
  "message": "OK"
}
```

#### `/ready`

A readiness check that verifies connectivity to PostgreSQL and Redis. Returns `200` if all services are reachable, or
`500` if any check fails.

`/ready: ok`

```json
{
  "ok": true,
  "message": "OK",
  "db": {
    "ok": true,
    "message": "Database OK"
  },
  "redis": {
    "ok": true,
    "message": "Redis OK"
  }
}
```

`/ready: not ok`

```json
{
  "ok": false,
  "message": "App is not live",
  "db": {
    "ok": false,
    "message": "connect ECONNREFUSED 127.0.0.1:5432"
  },
  "redis": {
    "ok": false,
    "message": "connect ECONNREFUSED 127.0.0.1:6379"
  }
}
```

### OpenTelemetry

[OpenTelemetry](https://opentelemetry.io/docs/languages/js/) support is included with support for traces, metrics, and
logs.

[@opentelemetry/auto-instrumentations-node](https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-node) is
set up to automatically collect metrics and spans for various services.

See the [observability README](./observability/README.MD) for a compose file with various services for collecting and
viewing signals.

> **Note:** Global and per-signal instrumentation needs to be enabled via [config](#configuration).

#### Config

| Key                                    | Description                                                                                                                                       |
|----------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `instrumentation.enabled`              | Global toggle. Must be `true` for any other instrumentation settings to take effect.                                                              |
| `instrumentation.debug`                | Print debug information from the OpenTelemetry SDK.                                                                                               |
| `instrumentation.sampleRatio`          | Configures the [TraceIDRatioBasedSampler](https://opentelemetry.io/docs/languages/js/sampling/). Value between `0` (drop all) and `1` (keep all). |
| `instrumentation.logs.logData`         | Whether to include the full `data` object passed into log calls.                                                                                  |
| `instrumentation.logs.logRequestData`  | Whether to include request headers, query params, and body in logs. When `false`, these fields are stripped.                                      |
| `instrumentation.logs.logResponseData` | Whether to include response headers and body in logs. When `false`, these fields are stripped.                                                    |

#### Traces

Automatic instrumentation is enabled and will suit most needs.

Custom spans can be created as described in
the [OpenTelemetry docs](https://opentelemetry.io/docs/languages/js/instrumentation/#create-spans).

#### Metrics

HTTP metrics are automatically collected by `@opentelemetry/instrumentation-http`.

```
sum by(http_route) (rate(nb_http_server_duration_milliseconds_count[1m]))
```

See [OpenTelemetry docs](https://opentelemetry.io/docs/languages/js/instrumentation/#metrics) for how to create custom
metrics.

```typescript
const meter = opentelemetry.metrics.getMeter("UserService");
const getUserCounter = this.meter.createCounter("get_user");
getUserCounter.add(1, { user_id: id });
```

#### Logs

Logs are sent to the OpenTelemetry Collector using the [OtelTransport](src/logging/otel.transport.ts).

See [Logging](#logging) for how to log.

## Testing

### Unit & Integration Tests

Unit tests exercise individual functions, classes, and utilities in isolation. They are co-located alongside their source files as `*.spec.ts`.

Tests use [Jest](https://jestjs.io/) with `ts-jest`.

CRUD library tests (`src/lib/crud/**/*.spec.ts`) are documented separately in the [CRUD Layer docs](src/lib/crud/README.md#unit--integration-tests).

Running Tests:

```bash
npm run test          # Run all unit tests (Jest, verbose output)
npm run test:watch    # Run in watch mode (re-runs on file change)
npm run test:cov      # Run with coverage report
```

### End-to-End Tests

CRUD layer E2E tests are documented in the [CRUD Layer docs](src/lib/crud/README.md#end-to-end-tests).

Running E2E Tests:

```bash
# Run e2e tests in Docker (isolated stack, no local deps required)
npm run test:e2e

# Run e2e tests locally (requires a running app instance)
# Set TEST_API_HOST (default http://localhost:3000) and TEST_ADMIN_KEY to configure
npm run test:e2e:local
```

### Load Tests

Load tests are written using [Artillery](https://www.artillery.io/).

See the [load-test/](./load-test) directory.

## Deployment

### Docker

Build and run:

```bash
docker build -t nest-boilerplate .
docker run -p 3000:3000 nest-boilerplate
```

Docker Compose can be used to start the application and a database:

```bash
docker compose up -d
```

### CI

[GitHub Actions config](./.github/workflows/main-workflow.yml)  
![](https://github.com/MarkNjunge/nest-boilerplate/workflows/Main%20Workflow/badge.svg)
