# Nest Starter

A [NestJS](https://nestjs.com/) starter.

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

The starter uses the [config](https://www.npmjs.com/package/config) module to manage configs.

Default config vaues are found in [default.json](./config/default.json).  
You can override these values by creating a `local.json` file.  
You can also use environment variables by creating a `.env` file. See the variable mappings [here](./config/custom-environment-variables)

## Logging

A custom logger is implemented using [winston](https://www.npmjs.com/package/winston).

Create a logger using `new CustomLogger()`. A parameter can be passed into the constructor and will be used as a tag.

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

## Body validation

The starter uses [class-validator](https://www.npmjs.com/package/class-validator) and [class-transformer](https://www.npmjs.com/package/class-transformer) to validate request bodies.  
See [class-validator usage](https://www.npmjs.com/package/class-validator#usage)

## Exceptions

It is possible to thow exceptions in two ways:

```Typescript
throw new HttpException("Err", HttpStatus.UNAUTHORIZED);
```

If you want to add more information to the error

```Typescript
throw new HttpException(
    { message: "Unauthorized", meta: { key: "value" } },
    HttpStatus.UNAUTHORIZED,
);
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
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
