# Nest Starter

[![CI](https://github.com/MarkNjunge/nest-boilerplate/workflows/Main%20Workflow/badge.svg)](https://github.com/MarkNjunge/nest-boilerplate/actions/workflows/main-workflow.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/MarkNjunge/nest-boilerplate/badge.svg)](https://snyk.io/test/github/MarkNjunge/nest-boilerplate)

A boilerplate for [NestJS](https://nestjs.com/), using Fastify.

## Features

- [Features](#features)
- [Installation](#installation)
- [Running](#running)
- [Config](#config)
- [Secrets Manager](#secrets-manager)
- [CORS](#cors)
- [Database](#database)
- [Query Parsing](#query-parsing)
- [Swagger](#swagger)
- [File Upload](#file-upload)
- [Logging](#logging)
- [Request Context](#request-context)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Request Body Validation](#request-body-validation)
- [Response Mapping](#response-mapping)
- [Errors \& Exception Handling](#errors--exception-handling)
- [Health Check](#health-check)
- [OpenTelemetry](#opentelemetry)
- [Testing](#testing)
- [Docker](#docker)
- [CI](#ci)

## Installation

```bash
$ npm install
```

## Running

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Config

The [node-config](https://www.npmjs.com/package/config) package to manage configs.

Default config values are found in [default.json](./config/default.json).  
These values can be overridden by:

- Creating config files as described
  in [node-config docs](https://github.com/node-config/node-config/wiki/Configuration-Files)
- Creating a `local.json` file in _config/_
- Creating a `.env` file in the project directory. (supported via dotenv)
- Setting environment variables. See the environment variable mappings
  in [custom-environment-variables.json](./config/custom-environment-variables.json).

## Secrets Manager

For loading secrets from external sources (e.g., AWS Secrets Manager, HashiCorp Vault), implement the `loadSecrets()` function in [secrets-manager.ts](./src/config/secrets-manager.ts).

The function is called during application startup and its return value is deep-merged with the base config. This allows secrets to override any config values.

```typescript
// src/config/secrets-manager.ts
export async function loadSecrets(): Promise<any> {
  // Example: Load from AWS Secrets Manager
  const secrets = await getSecretsFromAWS();
  return {
    db: {
      url: secrets.DATABASE_URL,
    },
    apiKey: secrets.API_KEY,
  };
}
```

The secrets are loaded before the application modules are initialized, ensuring all services have access to the complete configuration.

## CORS

[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) is configurable via the config.

The following values are acceptable for `config.cors.origins`:

- `*` - Will accept any origin. The `access-control-allow-origin` header will always respond with
  the exact origin of the request, not a `*`.
- `https://example.com,https://example2.com` - Will accept all domains in the comma separated list.

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

When the server starts, migrations will run automatically, or, you can run the migrations
using `npm run migration up`

To revert the last migration:

```bash
npm run migration down
```

### BaseEntity

Classes should extend [BaseEntity](src/models/_base/_base.entity.ts) to automatically generate `id`,
`createdAt` and `updatedAt`.

### Base & CRUD Classes

The database layer uses inheritance to separate read and write operations:

Services:
- [BaseService](src/db/crud/base.service.ts) - Read-only operations (`count`, `list`, `get`, `getById`)
- [CrudService](src/db/crud/crud.service.ts) - Extends BaseService with write operations (`create`, `update`, `delete`, etc.)

Controllers:
- [BaseController](src/db/crud/base.controller.ts) - Read-only endpoints (no auth required)
- [CrudController](src/db/crud/crud.controller.ts) - Extends BaseController with write endpoints (auth required)

Use `BaseService`/`BaseController` for read-only access, `CrudService`/`CrudController` for full CRUD.

## Data Models

### Automatically using Plop

This project uses [Plop](https://plopjs.com/) to scaffold data models.

Run the generator with:
```shell
npm run codegen
```

The command will:
1. Create a model
2. Create a Service (optional)
3. Create a Controller (optional)
4. Module (if a service or controller was created)

After this you should:
1. Add fields to the created model, create dto and update dto.
2. Run `npm run migration generate migration_name` to create the migration.
3. Run the application

### Manually

BaseEntity, migration generation, CrudService (Or BaseService) and CrudController (or BaseController) enable quickly adding data models

1. Create a class that extends BaseEntity.
2. Generate the migration.
3. Review the migration.
4. Create the dtos, service, controller and module.

## Query Parsing

URL query to DB query parsing is available.

Example:

```
select=title,comments.content,comments.user.username
include=stock
filter=(postId,eq,post_):(createdAt,lt,2025-11-04T06:55:40.549Z):(price,between,120,200)
sort=(averageRating,ASC):(price,DESC)
limit=10
offset=20
```

### Select & Include

`select` will limit the fields returned, `include` will fetch relations.

These two can be combined to significantly reduce the data that is read.

For example,
`select=title,content,comments.content,comments.user.username&include=comments,comments.user`

```json
[
  {
    "title": "Getting Started with Machine Learning",
    "content": "ML is transforming tech. Here are the basics to get you started on your journey.",
    "comments": [
      {
        "content": "Great introduction! Very helpful for beginners.",
        "user": {
          "username": "Sarah"
        }
      },
      {
        "content": "Thanks for sharing. Which ML library do you recommend?",
        "user": {
          "username": "Emma"
        }
      }
    ]
  }
]
```

### Paging

Paging can be done using `limit` and `offset`.

### Filters

Filters take the format of `(column,operand,value,secondValue)`.
`value` and `secondValue` are optional, and only used where relevant e.g. `isnull` & `between`.

Multiple filters can be specified using a colon `:` as the delimiter.

Available operands are
`eq, ne, like, ilike, gt, lt, gte, lte, in, notin, isnull, isnotnull, between, notbetween, any, none, contains, containedby, raw`.

See [query.spec.ts](src/db/query/query.spec.ts)
and [typeorm-query-mapper.spec.ts](src/db/query/typeorm-query-mapper.spec.ts) for examples.

### Sort Order

Sort order takes the format of `(column,direction)` where direction can be `ASC,DESC`.  
Multiple orderings can be specified using a colon `:` as the delimiter.

## Swagger

Swagger documentation is automatically generated from the routes.

By default it is available at http://127.0.0.1:3000/docs

## File Upload

File uploads are configured.

See [FileUploadDto](./src/models/file-upload/file-upload.dto.ts) for an example dto.

### Config

`maxSize: number` - Max size in bytes. Default 5MB.  
`uploadDir: string` - Upload directory. If blank, it will default to the OS's temp directory.  
`removeAfterUpload: boolean` - Whether to delete files after the request completes.

## Logging

[Winston](https://www.npmjs.com/package/winston) is used as a logging library.

Create a logger instance using `new Logger()`.  
A parameter can be passed into the constructor and to be used as a tag (defaults to "Application").

For example,

```Typescript
import { Logger } from "@/logging/Logger";

const logger = new Logger("AppService");
```

```typescript
this.logger.debug("Hello!");

// 2019-05-10 19:47:21.570 | debug: [AppService] Hello!
```

A custom tag can be passed into the log functions.

```Typescript
this.logger.debug("Hello!", { tag: "AppService.getHello" });

// 2019-05-10 19:54:43.062 | debug: [AppService.getHello] Hello!
```

Extra data can be passed into the log functions. To enable printing it to the console, set the
config `logging.logDataConsole` to `true`.

```Typescript
this.logger.debug(`Hello ${ctx.traceId}`, { data: { traceId: ctx.traceId } });

// 2025-01-15 15:11:57.090 | debug: [AppService.getHello] Hello 47e4a86ea7c0676916b45bed6c80d1bb
// {
//   "traceId": "47e4a86ea7c0676916b45bed6c80d1bb"
// }
```

### Custom Transports

See [SampleTransport](src/logging/Sample.transport.ts) for an example.

### Redact Private Keys

Private keys are automatically redacted in logged data.

The private keys are specified in [redact.ts](src/utils/redact.ts)

```json
{
  "username": "mark",
  "contact": {
    "email": "REDACTED"
  }
}
```

## Request Context

[nestjs-cls](https://papooch.github.io/nestjs-cls/) is implemented to maintain the request state.

The request ID is the trace ID if observability is enabled, otherwise it's a random string.

It can be accessed using the `AppClsService`.

```typescript
class Service {
  constructor(
    // This needs to be ClsService<AppClsStore>. AppClsService will not work.
    private readonly clsService: ClsService<AppClsStore>
  ) {}

  handler() {
    this.clsService.getId();
  }
}
```

Alternatively, `@ReqCtx()` can be used.

```typescript
class Controller {
  @Get()
  getHello(@ReqCtx() ctx: IReqCtx) {
    console.log(ctx.traceId) // 0d8df9931b05fbcd2262bc696a1410a6
  }
}
```

## Authentication

Authentication is implemented using a modular service-based approach:

- **AuthModule** (`src/modules/auth/auth.module.ts`) - Global module providing auth services
- **AuthService** (`src/modules/auth/auth.service.ts`) - Validates tokens against `config.apiKey`
- **AuthGuard** (`src/guards/auth.guard.ts`) - Guards routes requiring authentication

The `AuthGuard` extracts the Bearer token, validates it via `AuthService`, and stores the authenticated user in the request context (CLS).

### Accessing the Authenticated User

Use the `@ReqCtx()` decorator to access the authenticated user:

```typescript
@UseGuards(AuthGuard)
@Get()
handler(@ReqCtx() ctx: IReqCtx) {
  console.log(ctx.traceId);  // Request trace ID
  console.log(ctx.user);     // { userId: "sample-user-id" }
}
```

The `IReqCtx` interface provides:
- `traceId: string` - Request trace ID for logging/debugging
- `user?: AuthenticatedUser` - Authenticated user info (when using AuthGuard)

## Rate Limiting

A rate limiter is configured
using [@nestjs/throttler](https://github.com/nestjs/throttler).  
It defaults to 100 request per minute (configurable in [default.json](./config/default.json))
.

## Request Body Validation

[class-validator](https://www.npmjs.com/package/class-validator)
and [class-transformer](https://www.npmjs.com/package/class-transformer) are used to validate
request bodies.

See [class-validator decorators](https://www.npmjs.com/package/class-validator#validation-decorators)
for available validation options.

An example of a response to an invalid body:

```JSON
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

NB: Raising an error when unknown values are passed can be disabled by
setting `validator.forbidUnknown` to `false` in the config.

## Response Mapping

Cleaning response objects using can be enabled using the `@Serialize(ClassName)` decorator.
It uses [class-transformer](https://www.npmjs.com/package/class-transformer).

## Errors & Exception Handling

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

## Health Check

Health check endpoints are set up at `/ready` and `/live`.

`/live: ok`
```json
{
  "ok": true,
  "message": "OK",
  "db": {
    "ok": true,
    "message": "Database OK"
  }
}
```

`/live: not ok`
```json
{
  "ok": false,
  "message": "App is not live",
  "db": {
    "ok": false,
    "message": "connect ECONNREFUSED 127.0.0.1:5432"
  }
}
```

## OpenTelemetry

[OpenTelemetry](https://opentelemetry.io/docs/languages/js/) support in included with support for
traces, metrics and logs.

[@opentelemetry/auto-instrumentations-node](https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-node)
is set up to automatically collect metrics and spans for various services

See the [observability README](./observability/README.MD) for a compose file with various services
for collecting and viewing signals.

**Note:** Global and per signal instrumentation needs to be enabled via [config](#config)

### Traces

Automatic instrumentation is enabled and will suite most needs.

Custom spans can be created as described in
the [OpenTelemetry docs](https://opentelemetry.io/docs/languages/js/instrumentation/#create-spans).

### Metrics

HTTP metrics are automatically collected by `@opentelemetry/instrumentation-http`

```
sum by(http_route) (rate(nb_http_server_duration_milliseconds_count[1m]))
```

See [OpenTelemetry docs](https://opentelemetry.io/docs/languages/js/instrumentation/#metrics) for
how to create custom metrics.

```typescript
const meter = opentelemetry.metrics.getMeter("UserService");
const getUserCounter = this.meter.createCounter("get_user")
getUserCounter.add(1, { user_id: id });
```

### Logs

Logs are sent to the OpenTelemetry Collector using
the [OtelTransport](src/logging/otel.transport.ts).

See [logging](#logging) for how to log.

## Testing

### Unit & Integration Tests

There exist unit tests for various functions, and integration tests for db operations.

```bash
npm run test
```

### End-to-end test

A Docker container is created to run end to end tests.

See [docker-compose-e2e.yml](./docker-compose-e2e.yml)

```bash
# e2e tests (docker)
npm run test:e2e

# e2e test (locally)
npm run test:e2e:local
```

### Load test

Load tests are written using [Grafana k6](https://grafana.com/oss/k6/).

See [load-test/](./load-test) directory.

## Docker

The application can be run using docker.

Build

```bash
docker build -t nest-boilerplate .

docker run -p 3000:3000 nest-boilerplate
```

Docker Compose can be used to start the application and a database.

```
docker compose up -d
```

## CI

[Github Actions config](./.github/workflows/main-workflow.yml)  
![](https://github.com/MarkNjunge/nest-boilerplate/workflows/Main%20Workflow/badge.svg)
