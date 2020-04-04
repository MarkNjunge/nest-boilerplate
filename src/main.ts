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
import * as helmet from "helmet";
import { requestTimeMiddleware } from "./common/middleware/request-time.middleware";

declare const module: any;

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

  intializeSwagger(app);

  if (config.rateLimit.enabled === true) {
    app.register(fastifyRateLimit, {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.timeWindow,
    });
  }

  app.enableCors({
    origin: config.cors.origin,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
  });

  app.use(helmet());

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(new ValidationPipe());
  app.use(requestTimeMiddleware);

  await app.listen(config.port, "0.0.0.0");
  logger.log(`Started on port ${config.port}`);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
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
