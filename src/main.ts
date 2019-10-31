import { NestFactory } from "@nestjs/core";
import { CustomLogger, initializeWinston } from "./common/CustomLogger";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions-filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ValidationPipe } from "./common/pipes/validation.pipe";
import { config } from "./common/Config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import * as fastifyRateLimit from "fastify-rate-limit";

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
    .setVersion(process.env.npm_package_version)
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

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(config.port, "0.0.0.0");
  new CustomLogger("Application").log(`Server started on port ${config.port}`);
}
bootstrap();
