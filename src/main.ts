import { config, bool } from "./config";
import "./utils/instrumentation";
import { NestFactory, Reflector } from "@nestjs/core";
import { Logger, initializeWinston } from "./logging/Logger";
import { AppModule } from "./modules/app/app.module";
import { AllExceptionsFilter } from "./filters/all-exceptions.filter";
import { ValidationPipe } from "./pipes/validation.pipe";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { default as helmet } from "@fastify/helmet";
import { globalMiddleware } from "./middleware/global.middleware";
import { ApplicationLogger } from "./logging/ApplicationLogger";
import { GlobalInterceptor } from "./interceptors/global.interceptor";
import { DbService } from "@/modules/_db/db.service";
import multipart from "@fastify/multipart";
import { FileHandler } from "@/utils/file-handler";
import { ClsService, ClsServiceManager } from "nestjs-cls";
import { AppClsStore } from "@/cls/app-cls";

initializeWinston();
const logger = new Logger("Application");

bootstrap().catch((e: Error) => logger.error(`Startup error: ${e}`, {}, e));

async function bootstrap(): Promise<void> {
  logger.info("****** Starting API ******");

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    {
      logger:
        process.env.NODE_ENV === "production" ? false : new ApplicationLogger(),
    },
  );

  await enablePlugins(app);
  initializeSwagger(app);

  const clsService: ClsService<AppClsStore> = ClsServiceManager.getClsService();

  app.useGlobalFilters(new AllExceptionsFilter(clsService));
  app.useGlobalInterceptors(new GlobalInterceptor(new Reflector(), clsService));
  app.useGlobalPipes(new ValidationPipe());
  app.use(globalMiddleware);

  const dbService = app.get<DbService>(DbService);
  // Catch this to allow the application to start when the db is unreachable
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
      } else if (origin && whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"), false);
      }
    },
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
  });

  await app.register(multipart, {
    attachFieldsToBody: "keyValues",
    limits: {
      fileSize: config.fileUpload.maxSize
    },
    onFile: async part => {
      (part as any).value = await FileHandler.writeUploadFile(part);
    }
  });
}

process.on("uncaughtException", (e, origin) => {
  logger.error(`${origin}: ${e.message}`, {}, e);
});

function initializeSwagger(app: NestFastifyApplication): void {
  if (!bool(config.swagger.enabled)) {
    return;
  }

  const options = new DocumentBuilder()
    .setTitle(config.appName)
    .setVersion(config.appVersion)
    .addSecurity("api-key", {
      type: "http",
      in: "header",
      scheme: "bearer",
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(config.swagger.endpoint, app, document);
}
