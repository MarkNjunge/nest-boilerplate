# Nest Starter

[![CI](https://github.com/MarkNjunge/nest-boilerplate/workflows/Main%20Workflow/badge.svg)](https://github.com/MarkNjunge/nest-boilerplate/actions/workflows/main-workflow.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/MarkNjunge/nest-boilerplate/badge.svg)](https://snyk.io/test/github/MarkNjunge/nest-boilerplate)

A boilerplate for [NestJS](https://nestjs.com/), using Fastify.

## Features

- [Config](#config)
- [Database](#database)
- [Swagger (API docs)](#swagger)
- [Logging](#logging)
- [Auth guard](#auth-guard)
- [Rate limiting](#rate-limiting)
- [Request body validation](#request-body-validation)
- [Exception Handling](#exception-handling)
- [Docker support](#docker)
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
- `*` - Will accept any origin.   
**Note:** It will respond with the origin requested,  not `*`. e.g. `access-control-allow-origin: https://example.com`
- `https://example.com,https://example2.com` - Will accept all domains in the comma separated list.

## Database

[Typeorm](https://typeorm.io/) is used for database operations.

It uses PostgreSQL by default, but that can be changed by changing the `type`
in [db-data-source.ts](./src/db/db-data-source.ts).  
See [TypeORM documentation](https://typeorm.io/#/) for supported databases.

### Migrations

Typeorm is configured to use migrations instead of `synchronize: true`.

Migrations can be generated using:
```bash
npm run migration:generate --name=your_migration_name

# linux/mac
npm run migration:generate:l --name=your_migration_name  
```

You can also use the following to only create the file and write the migration logic yourself.
```bash
npm run migration:create --name=your_migration_name

# linux/mac
npm run migration:create:l --name=your_migration_name  
```

When the server starts, migrations will run automatically, or, you can run the migrations
using `npm run migration:run`

## Swagger

Swagger documentation is automatically generated from the routes.

By default it is available at http://127.0.0.1:3000/docs

See config in [default.json](./config/default.json).

## Logging

A custom logger is implemented using [winston](https://www.npmjs.com/package/winston).

Create a logger instance using `new CustomLogger()`.  
A parameter can be passed into the constructor and to be used as a tag (defaults to "Application").

For example,

```Typescript
const logger = new CustomLogger("AppService");
```

```typescript
this.logger.debug("Hello!");

// Output:
// 2019-05-10 19:47:21.570 | debug: [AppService] Hello!
```

A custom tag can be passed into the log functions.

```Typescript
this.logger.debug("Hello!", { tag: "AppService.getHello" });

// Output
// 2019-05-10 19:54:43.062 | debug: [AppService.getHello] Hello!
```

Extra data can be passed into the log functions. To enable printing it to the console, set the
config `logging.logDataConsole` to `true`.

```Typescript
this.logger.debug("Hello!", "AppService.getHello", { data: { user: "mark" } });

// Output
// 2022-07-10 11:59:43.319 | debug: [AppService] Hello!
// {"user":"mark"}
```

To log to other locations, a [custom transport](https://github.com/winstonjs/winston-transport) is
needed. See [SampleTransport](src/logging/Sample.transport.ts) for an example.

#### Redact Private Keys

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

### Correlation

A correlation ID header is set and can be used to correlate requests.  
It can be accessed using the `@ReqCtx()` header.

```typescript
@Get()
function getHello(@ReqCtx() ctx: IReqCtx) {
  console.log(ctx.correlationId) // c855677c64c654d1
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
using [fastify-rate-limit](https://github.com/fastify/fastify-rate-limit).  
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
  "correlationId": "775523bae019485d",
  "meta": {
    "id": 1
  }
}
```

Regular errors an unhandled exceptions are also caught and returned as a 500 response.

```json
{
  "status": 500,
  "message": "Uncaught exception",
  "code": "InternalError",
  "correlationId": "d3cb1b2b3388e3b1"
}
```

## Docker

The application can be run using docker.

Build

```bash
docker build -t nest-boilerplate .

docker run -p 3000:3000 nest-boilerplate
```

Docker Compose can be used to start the application and a database.

```
docker-compose up -d
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

# CI

[Github Actions config](./.github/workflows/main-workflow.yml)  
![](https://github.com/MarkNjunge/nest-boilerplate/workflows/Main%20Workflow/badge.svg)
