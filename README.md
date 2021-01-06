# Nest Starter

[![Build Status](https://travis-ci.com/MarkNjunge/nest-boilerplate.svg?branch=master)](https://travis-ci.com/MarkNjunge/nest-boilerplate)
![](https://github.com/MarkNjunge/nest-boilerplate/workflows/Main%20Workflow/badge.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/MarkNjunge/nest-boilerplate/badge.svg)](https://snyk.io/test/github/MarkNjunge/nest-boilerplate)

A boilerplage for [NestJS](https://nestjs.com/), using Fastify.

See Express branch [here](https://github.com/MarkNjunge/nest-boilerplate/tree/express-adapter) (**extremely outdated**).

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
$ yarn install
```

## Running

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Config

The [node-config](https://www.npmjs.com/package/config) package to manage configs.

Default config values are found in [default.json](./config/default.json).  
These values can be overridden by:

- Creating a `local.json` file in _config/_
- Creating a `.env` file in the projcect directory.
- Setting environment variables. See the environment variable mappings in [custom-environment-variables.json](./config/custom-environment-variables.json).

## Database

[Typeorm](https://typeorm.io/) is used for database operations.

It uses PostgreSQL by default, but that can be changed by changing the `type` in [app.module.ts](./src/app.module.ts).  
See [TypeORM documentation](https://typeorm.io/#/) for supported databases.

### Migrations

Typeorm is configured to use migrations instead of `synchronize: true`.

To take advantage of TypeORM's [ability to generate migrations](https://typeorm.io/#/migrations/) by inspecting your entities, the cli needs to be configured. Create a `.env` file based on [.env.sample](.env.sample).

You can then generate migrations using `yarn migration:generate <your_migration_name>`.  
You can also use `yarn migration:create <your_migration_name>` to only create the file and write the migration logic yourself.

When the server starts, migrations will run automatically, or, you can run the migrations using `yarn migration:run`

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
const logger =  new CustomLogger("AppService");
```

```typescript
this.logger.debug("Hello!");

// Output:
// 2019-05-10 19:47:21.570 | debug: [AppService] Hello!
```

A custom tag can be passed into the log functions.

```Typescript
this.logger.debug("Hello!", "AppService.getHello");

// Output
// 2019-05-10 19:54:43.062 | debug: [AppService.getHello] Hello!
```

Extra data can be passed into the log functions. This data will not be printed to the console. To access it, a [custom transport](https://github.com/winstonjs/winston-transport) is needed. See [SampleTransport](./src/common/logging/Sample.transport.ts) for an example.

```Typescript
this.logger.debug("Hello!", "AppService.getHello", { user: "mark" });

// Output
// 2019-05-10 19:54:43.062 | debug: [AppService.getHello] Hello!
```

### Correlation 

A correlation ID header is set and can be used to correlate requests.  
It can be accessed using the `@CorrelationId()` header.
```typescript
@Get()
getHello(@CorrelationId() correlationId: string) {
  console.log(correlationId)
  // b945c41d-ae51-4170-80b5-3c2200cbe25d
}
```

### Sensitive parameters

Sensitive parameters specified in the config option `logging.sensitiveParams` will be replaced with the value in `logging.replacementString`.

See [remove-sensitive.ts](./src/common/logging/remove-sensitive.ts)

```json
Before
{
  "username": "mark",
  "password": "abc123"
}

After
{
  "username": "mark",
  "password": "REDACTED"
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

A rate limiter is configured using [fastify-rate-limit](https://github.com/fastify/fastify-rate-limit).  
It defaults to 100 request per minute per IP (configurable in [default.json](./config/default.json)).

## Request Body Validation

[class-validator](https://www.npmjs.com/package/class-validator) and [class-transformer](https://www.npmjs.com/package/class-transformer) are used to validate request bodies.

See [class-validator decorators](https://www.npmjs.com/package/class-validator#validation-decorators) for available validation options.

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

NB: Raising an error when unknown values are passed can be disabled by setting `validator.forbidUnknown` to `false` in the config.

## Errors & Exception Handling

Errors are returning in the following format

```json
{
  "status": 403,
  "message": "This resource is currently restricted",
  "code": "Restricted",
  "correlationId": "b945c41d-ae51-4170-80b5-3c2200cbe25d"
}
```

Exceptions can be thrown using:

- Nest's [Built-in HTTP Exceptions](https://docs.nestjs.com/exception-filters#built-in-http-exceptions)

```Typescript
throw new ForbiddenException("Forbidden");

// or with more detail

throw new ForbiddenException({
  message: "Forbidden",
  code: ErrorCodes.RESTRICTED,
  meta: { reason: "Token does not have access to resource" },
});
```

- the HttpException class

```typescript
throw new HttpException(
  {
    message: "This resource is currently restricted",
    code: ErrorCodes.RESTRICTED,
  },
  403,
);
```

All non HttpExceptions errors are caught and returned as a 500 response.

**NB:** The `meta` and `code` fields are optional.  
**NB:** All fields other than `message`, `code`, and `meta` will be ignored.

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
yarn test
```

### End-to-end test

A Docker container is created to run end to end tests. 

See [docker-compose-e2e.yml](./docker-compose-e2e.yml)


```bash
# e2e tests (docker)
yarn test:e2e

# e2e test (locally)
yarn test:e2e:local
```

# CI

[Travis CI config](./.travis.yml)  
[![Build Status](https://travis-ci.com/MarkNjunge/nest-boilerplate.svg?branch=master)](https://travis-ci.com/MarkNjunge/nest-boilerplate)

[Github Actions config](./.github/workflows/main-workflow.yml)  
![](https://github.com/MarkNjunge/nest-boilerplate/workflows/Main%20Workflow/badge.svg)
