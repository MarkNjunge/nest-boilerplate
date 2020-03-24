# Nest Starter

[![Build Status](https://travis-ci.com/MarkNjunge/nest-starter.svg?branch=master)](https://travis-ci.com/MarkNjunge/nest-starter)
![](https://github.com/MarkNjunge/nest-starter/workflows/Main%20Workflow/badge.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/MarkNjunge/nest-starter/badge.svg)](https://snyk.io/test/github/MarkNjunge/nest-starter)

A starter for [NestJS](https://nestjs.com/), using Fastify.

See Express branch [here](https://github.com/MarkNjunge/nest-starter/tree/express-adapter) (**extremely outdated**).

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
You can also use `yarn migration:create <your_migration_name>` to only create the file.

When the server starts, migrations will run automatically, or, you can run the migrations using `yarn migration:run`

## Swagger

Swagger documentation is automatically generated from the routes.

See config in [default.json](./config/default.json).

## Logging

A custom logger is implemented using [winston](https://www.npmjs.com/package/winston).

Create a logger using `new CustomLogger()`.  
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

A custom tag can also be passed into the log functions.

```Typescript
this.logger.debug("Hello!", "AppService.getHello");

// Output
// 2019-05-10 19:54:43.062 | debug: [AppService.getHello] Hello!
```

## Auth Guard

An authentication guard is available in [auth.guard.ts](./src/common/guards/auth.guard.ts)

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

The starter uses [class-validator](https://www.npmjs.com/package/class-validator) and [class-transformer](https://www.npmjs.com/package/class-transformer) to validate request bodies.  
See [class-validator decorators](https://www.npmjs.com/package/class-validator#validation-decorators)

An example of a response to an invalid body,

```JSON
{
  "status": 400,
  "message": "Validation failed",
  "meta": [
    {
      "property": "username",
      "constraints": [
        "username should not be empty"
      ]
    },
    {
      "property": "address.country.name",
      "constraints": [
        "name should not be empty"
      ]
    },
    {
      "property": "address.city",
      "constraints": [
        "city should not be empty"
      ]
    }
  ]
}
```

## Exception Handling

All non HttpException errors are caught and returned as a 500 response.

Exceptions can be thrown using Nest's [Built-in HTTP Exceptions](https://docs.nestjs.com/exception-filters#built-in-http-exceptions)

```Typescript
throw new ForbiddenException({
  message: "Forbidden",
  meta: { reason: "Token does not have access to resource" },
});
```

or using the HttpException class

```typescript
throw new HttpException({ message: "Misdirected Request" }, 421);
```

**\*** The `meta` field is optional.  
**\*** All fields other than `message` and `meta` will be ignored.

## Docker

Build

```bash
docker build -t nest-starter .
```

Run

```bash
docker run -p 3000:3000 nest-starter
```

Docker Compose

```
docker-compose up -d
```

## Testing

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

# CI

[Travis CI config](./.travis.yml)  
[![Build Status](https://travis-ci.com/MarkNjunge/nest-starter.svg?branch=master)](https://travis-ci.com/MarkNjunge/nest-starter)

[Github Actions config](./.github/workflows/main-workflow.yml)  
![](https://github.com/MarkNjunge/nest-starter/workflows/Main%20Workflow/badge.svg)
