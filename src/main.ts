import { NestFactory } from "@nestjs/core";
import { CustomLogger, initializeWinston } from "./common/logging/CustomLogger";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions-filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ValidationPipe } from "./common/pipes/validation.pipe";
import { config, configAsBoolean } from "./common/Config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import * as fastifyRateLimit from "fastify-rate-limit";
import * as helmet from "fastify-helmet";
import { requestTimeMiddleware } from "./common/middleware/request-time.middleware";

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

  app.register(helmet);
  app.enableCors({
    origin: config.cors.origin,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
  });

  if (config.rateLimit.enabled === true) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    app.register(fastifyRateLimit, {
      max: 1,
      timeWindow: config.rateLimit.timeWindow,
    });
  }

  intializeSwagger(app);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(new ValidationPipe());
  app.use(requestTimeMiddleware);

  await app.listen(config.port, "0.0.0.0");
  logger.log(`Started on port ${config.port}`);
}
bootstrap();

function intializeSwagger(app: NestFastifyApplication) {
  if (configAsBoolean(config.swagger.enabled) === false) {
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
