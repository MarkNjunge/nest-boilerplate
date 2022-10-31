import { NestFactory } from "@nestjs/core";
import { Logger, initializeWinston } from "./logging/Logger";
import { AppModule } from "./modules/app/app.module";
import { AllExceptionsFilter } from "./filters/all-exceptions-filter";
import { LoggingInterceptor } from "./interceptors/logging.interceptor";
import { ValidationPipe } from "./pipes/validation.pipe";
import { config, bool } from "./config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import * as fastifyRateLimit from "@fastify/rate-limit";
import { default as helmet } from "@fastify/helmet";
import { requestHeadersMiddleware } from "./middleware/request-headers.middleware";
import { ApplicationLogger } from "./logging/ApplicationLogger";
import { ResponseInterceptor } from "./interceptors/response.interceptor";
import { DbService } from "@/modules/_db/db.service";

initializeWinston();
const logger = new Logger("Application");

bootstrap().catch((e: Error) => logger.error(e.message));

async function bootstrap(): Promise<void> {
  logger.info("****** Starting API ******");

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: process.env.NODE_ENV === "production" ?
        false :
        new ApplicationLogger(),
    },
  );

  await enablePlugins(app);
  initializeSwagger(app);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(new ValidationPipe());
  app.use(requestHeadersMiddleware);

  const dbService = app.get<DbService>(DbService);
  // await dbService.testConnection(); // Catch this
  await dbService.migrateLatest();

  await app.listen(config.port, "0.0.0.0");
  logger.info(`App running at http://127.0.0.1:${config.port}`);
}

async function enablePlugins(app: NestFastifyApplication): Promise<void> {
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
    hsts: false,
  });

  app.enableCors({
    origin(origin, callback) {
      const whitelist = config.cors.origins.split(",");
      if (config.cors.origins === "*") {
        callback(null, true);
      } else if (whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
  });

  if (bool(config.rateLimit.enabled)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-errors: Type issues
    await app.register(fastifyRateLimit, {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.timeWindow,
    });
  }
}

function initializeSwagger(app: NestFastifyApplication): void {
  if (!bool(config.swagger.enabled)) {
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
    .addSecurity("api-key", {
      type: "http",
      in: "header",
      scheme: "bearer",
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(config.swagger.endpoint, app, document);
}
