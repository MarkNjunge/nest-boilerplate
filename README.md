# Nest Starter

[![Build Status](https://travis-ci.com/MarkNjunge/nest-starter.svg?branch=master)](https://travis-ci.com/MarkNjunge/nest-starter)

A [NestJS](https://nestjs.com/) starter.

See Express branch [here](https://github.com/MarkNjunge/nest-starter/tree/express-adapter) (outdated, but works).

## Features

- [Config](#config)
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

The [config](https://www.npmjs.com/package/config) package to manage configs.
Default config values are found in [default.json](./config/default.json).  
You can override these values by creating a `local.json` file.  
You can also use environment variables by creating a `.env` file. See the variable mappings [here](./config/custom-environment-variables.json).

## Swagger

Swagger documentation is automatically generated from the routes. They are available at `/docs` (configurable in [config](./config/default.json)).

## Logging

A custom logger is implemented using [winston](https://www.npmjs.com/package/winston).

Create a logger using `new CustomLogger()`. A parameter can be passed into the constructor and will be used as a tag (defaults to "Application").

For example,

```Typescript
logger: CustomLogger = new CustomLogger("AppService");

this.logger.debug("Hello!");
```

will output

```bash
2019-05-10 19:47:21.570 | debug: [AppService] Hello!
```

A custom tag can also be passed into the log functions.

```Typescript
this.logger.debug("Hello!", "AppService.getHello");
```

will output

```bash
2019-05-10 19:54:43.062 | debug: [AppService.getHello] Hello!
```

## Auth Guard

An authentication guard is available in [auth.guard.ts](./src/common/guards/auth.guard.ts)

It can be enabled but adding a `UseGuards` decorator

```Typescript
@UseGuards(AuthGuard)
```

or globally

```Typescript
app.useGlobalGuards(new AuthGuard());
```

## Rate Limiting

A rate limiter is configured using [fastify-rate-limit](https://github.com/fastify/fastify-rate-limit).  
It defaults to 100 request per minute (configurable in [config](./config/default.json)).

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

All non HttpExceptions are caught and returns as a 500 response.

It is possible to thow exceptions in two ways:

```Typescript
throw new HttpException("Route requires authenticaiton", HttpStatus.UNAUTHORIZED);
```

If you want to add more information to the error

```Typescript
throw new HttpException(
    { message: "Route requires authenticaiton", meta: { key: "value" } },
    HttpStatus.UNAUTHORIZED,
);
```

Predefied error classes can also be used. See [NestJS HTTP Exceptions documentation](https://docs.nestjs.com/exception-filters#http-exceptions)

```Typescript
throw new UnauthorizedException({
  message: "Route requires authenticaiton",
  meta: { key: "value" },
});
```

## Docker

Build

```bash
docker build -t nest-starter .
```

Run

```bash
docker run -p 3000:3000 nest-starter
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

[Github Actions config](./.github/workflows/main-workflow.yml)
