import { NestFactory } from "@nestjs/core";
import { CustomLogger, initializeWinston } from "./common/CustomLogger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ValidationPipe } from "./common/pipes/validation.pipe";
import { config } from "./common/Config";
import * as rateLimit from "express-rate-limit";

async function bootstrap() {
  initializeWinston();

  const app = await NestFactory.create(AppModule, {
    logger: new CustomLogger("NestApplication"),
  });

  app.use(
    rateLimit({
      windowMs: 1000 * 60,
      max: 100,
      message: {
        statusCode: 429,
        error: "Too Many Requests",
        message: "Rate limit exceeded, retry in 1 minute",
      },
    }),
  );

  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type, Accept",
  });

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
