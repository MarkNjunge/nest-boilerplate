import { NestFactory } from "@nestjs/core";
import { CustomLogger, initializeWinston } from "./common/CustomLogger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ValidationPipe } from "./common/pipes/validation.pipe";
import { config } from "./common/Config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import * as fastifyRateLimit from "fastify-rate-limit";
import * as fs from "fs";
import { ErrorFilter } from "./common/filters/error.filter";

async function bootstrap() {
  initializeWinston();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: new CustomLogger("NestApplication"),
    },
  );

  const options = new DocumentBuilder()
    .setTitle("nest-starter")
    .setDescription("nest-starter API description")
    .setVersion(getCurrentApiVersion())
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(config.swaggerEndpoint, app, document);

  app.register(fastifyRateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitTimeWindow,
  });

  app.enableCors({
    origin: config.corsOrigin,
    methods: config.corsMethods,
    allowedHeaders: config.corsHeaders,
  });

  app.useGlobalFilters(new ErrorFilter());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(config.port).then(() => {
    new CustomLogger("Application").log(
      `Server started on port ${config.port}`,
    );
  });
}
bootstrap();

function getCurrentApiVersion(): string {
  const data = fs.readFileSync(__dirname + "\\..\\package.json");
  return JSON.parse(data.toString()).version;
}
