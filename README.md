# Nest Starter

[![CI](https://github.com/MarkNjunge/nest-boilerplate/workflows/Main%20Workflow/badge.svg)](https://github.com/MarkNjunge/nest-boilerplate/actions/workflows/main-workflow.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/MarkNjunge/nest-boilerplate/badge.svg)](https://snyk.io/test/github/MarkNjunge/nest-boilerplate)

A boilerplate for [NestJS](https://nestjs.com/), using Fastify.

## Features

- [Config](#config)
- [Database](#database)
- [Swagger (API docs)](#swagger)
- [Query Parsing](#query-parsing)
- [File Upload](#file-upload)
- [Logging](#logging)
- [Request Context](#request-context)
- [Auth guard](#auth-guard)
- [Rate limiting](#rate-limiting)
- [Request body validation](#request-body-validation)
- [Exception Handling](#errors--exception-handling)
- [OpenTelemetry](#opentelemetry)
- [Docker](#docker)
- [Testing](#testing)
- [Continuous Integration](#ci)

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
- Creating config files as described in [node-config docs](https://github.com/node-config/node-config/wiki/Configuration-Files)
- Creating a `local.json` file in _config/_
- Creating a `.env` file in the project directory. (supported via dotenv)
- Setting environment variables. See the environment variable mappings
  in [custom-environment-variables.json](./config/custom-environment-variables.json).

## CORS
[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) is configurable via the config.


The following values are acceptable for `config.cors.origins`:
- `*` - Will accept any origin. The `access-control-allow-origin` header will always respond with the exact origin of the request, no a `*`.   
- `https://example.com,https://example2.com` - Will accept all domains in the comma separated list.

## Database

[Objection](https://vincit.github.io/objection.js/) (which uses [Knex.js](https://knexjs.org/)) 
is used for database operations.

It uses PostgreSQL by default, but that can be changed by changing the `client`
in [knexfile.ts](./src/db/knexfile.ts).  
See [Knex documentation](https://knexjs.org/guide/#node-js) for supported databases.

Conversion of column names from camel case to snake case is automatically done in most cases.   
It however does not work in all cases. See excerpt below from Objection docs
([Snake case to camel case conversion](https://vincit.github.io/objection.js/recipes/snake-case-to-camel-case-conversion.html)):

> When the conversion is done on objection level only database columns of the returned
> rows (model instances) are convered to camel case. You still need to use snake case in
> relationMappings and queries. Note that insert, patch, update and their variants still
> take objects in camel case. The reasoning is that objects passed to those methods
> usually come from the client that also uses camel case.


### Migrations

Schema changes require migrations.

Migrations can be created using:
```bash
npm run migration:make
```

When the server starts, migrations will run automatically, or, you can run the migrations
using `npm run migration:latest`

## Swagger

Swagger documentation is automatically generated from the routes.

By default it is available at http://127.0.0.1:3000/docs

## Query Parsing

URL query to DB query parsing is available. See [query-parser.ts](./src/utils/query-parser.ts).

**Note:** There is currently no limitation put on the complexity of the query, so this should be exposed with caution. 

Example:
```
limit=10&page=1&orderBy=(averageRating,DESC)&filter=(authors,=,Bill Bryson):(yearPublished,>,2000)
```

```SQL
SELECT "*"
FROM   "..."
WHERE  "authors" = 'Bill Bryson'
  AND "year_published" > '2000'
ORDER  BY "average_rating" DESC
  LIMIT  10 
```

### Paging

Paging can either be done using `limit` and `page`.

### Filters

Filters take the format of `(column,operand,value)` where the operand can be `=,>,>=,<,<=`.  
Column names are automatically converted to snake case.  
Multiple filters can be specified using a colon `:` as the delimiter.

### Ordering

Ordering takes the format of `(column,direction)` where direction can be `desc,DESC,asc,ASC`.  
Multiple orderings can be specified using a colon `:` as the delimiter.

## File Upload

File uploads are available.

### Config

`maxSize: number` - Max size in bytes. Default 5MB.  
`uploadDir: string` - Upload directory. If blank, it will default to the OS's temp directory.  
`removeAfterUpload: string` - Whether to delete files after the request completes.

Upload a single file
```
@ApiProperty({ type: "string", format: "binary" })
@IsNotEmpty()
@IsObject({ message: "$property must be a single file" })
@ValidateNested({ message: "$property must be a file" })
@Type(() => UploadedFileDto)
file2: UploadedFileDto;
```

Upload multiple files
```
@ApiProperty({ type: "array", items: { type: "string", format: "binary" } })
@IsNotEmpty()
@IsArray({ message: "$property must be multiple files" })
@ValidateNested({ message: "$property must be a file", each: true })
@Type(() => UploadedFileDto)
file1: UploadedFileDto[];
```
See [FileUploadDto](./src/models/file-upload/file-upload.dto.ts) for a full example.

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

To log to other locations, a [custom transport](https://github.com/winstonjs/winston-transport) is
needed. See [SampleTransport](src/logging/Sample.transport.ts) for an example.

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

Request context. be accessed using the `@ReqCtx()` header.

It contains a `traceId`.  

```typescript
@Get()
function getHello(@ReqCtx() ctx: IReqCtx) {
  console.log(ctx.traceId) // 0d8df9931b05fbcd2262bc696a1410a6
}
```

## Auth Guard

An authentication guard is available in [auth.guard.ts](./src/guards/auth.guard.ts)

It can be enabled by adding a `UseGuards` decorator to a controller or route

```Typescript
@UseGuards(AuthGuard)
```

or globally

```Typescript
app.useGlobalGuards(new AuthGuard());
```

## Rate Limiting

A rate limiter is configured
using [@nestjs/throttler](https://github.com/nestjs/throttler).  
It defaults to 100 request per minute per IP (configurable in [default.json](./config/default.json))
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

## OpenTelemetry

[OpenTelemetry](https://opentelemetry.io/docs/languages/js/) support in included with support for traces, metrics and logs.

[@opentelemetry/auto-instrumentations-node](https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-node) is set up to automatically collect metrics and spans for various services

See the [observability README](./observability/README.MD) for a compose file with various services for collecting and viewing signals.

**Note:** Instrumentation needs to be enabled via [config](#config)

### Traces

Automatic instrumentation is enabled and will suite most needs. 

Custom spans can be created as described in the [OpenTelemetry docs](https://opentelemetry.io/docs/languages/js/instrumentation/#create-spans).

### Metrics

HTTP metrics are automatically collected by `@opentelemetry/instrumentation-http`

```
sum by(http_route) (rate(nb_http_server_duration_milliseconds_count[1m]))
```

See [OpenTelemetry docs](https://opentelemetry.io/docs/languages/js/instrumentation/#metrics) for how to create custom metrics.

```typescript
const meter = opentelemetry.metrics.getMeter("UserService");
const getUserCounter = this.meter.createCounter("get_user")
getUserCounter.add(1, { user_id: id });
```

### Logs

Logs are sent to the OpenTelemetry Collector using the [OtelTransport](src/logging/otel.transport.ts).

See [logging](#logging) for how to log.

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

## Testing

### Unit test

There exist unit tests for controllers and services.

Dependencies are mocked using `jest`.

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

# CI

[Github Actions config](./.github/workflows/main-workflow.yml)  
![](https://github.com/MarkNjunge/nest-boilerplate/workflows/Main%20Workflow/badge.svg)
