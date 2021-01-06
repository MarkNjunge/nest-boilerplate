import { NestFactory } from "@nestjs/core";
import { CustomLogger, initializeWinston } from "./common/logging/CustomLogger";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./filters/all-exceptions-filter";
import { LoggingInterceptor } from "./interceptors/logging.interceptor";
import { ValidationPipe } from "./pipes/validation.pipe";
import { config } from "./common/Config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import * as fastifyRateLimit from "fastify-rate-limit";
import { default as helmet } from "fastify-helmet";
import { requestHeadersMiddleware } from "./middleware/request-headers.middleware";

async function bootstrap() {
  initializeWinston();
  const logger = new CustomLogger("Application");
  logger.log("****** Starting API ******");

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: process.env.NODE_ENV === "production" ? false : logger,
    },
  );


  await enablePlugins(app);
  initializeSwagger(app);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(new ValidationPipe());
  app.use(requestHeadersMiddleware);

  await app.listen(config.port, "0.0.0.0");
  logger.log(`App running at http://127.0.0.1:${config.port}`);
}
bootstrap();

async function enablePlugins(app: NestFastifyApplication) {
  await app.register(helmet, {
    // A custom Content Security Policy config is required in order for swagger to work
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "validator.swagger.io"],
        scriptSrc: ["'self'", "https: 'unsafe-inline'"],
      },
    },
  });

  app.enableCors({
    origin: config.cors.origin,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
  });

  if (Boolean(config.rateLimit.enabled) === true) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await app.register(fastifyRateLimit, {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.timeWindow,
    });
  }
}

function initializeSwagger(app: NestFastifyApplication) {
  if (Boolean(config.swagger.enabled) === false) {
    return;
  }

  const options = new DocumentBuilder()
    .setTitle(config.swagger.title)
    .setDescription(config.swagger.description)
    .setContact(
      config.swagger.contact.name,
      config.swagger.contact.url,
      config.swagger.contact.email,
    )
    .addSecurity("x-api-key", {
      type: "apiKey",
      in: "header",
      name: "x-api-key",
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(config.swagger.endpoint, app, document);
}
