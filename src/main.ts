import { NestFactory } from "@nestjs/core";
import * as winston from "winston";
import * as moment from "moment";
import { CustomLogger } from "./common/CustomLogger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ValidationPipe } from "./common/pipes/validation.pipe";
import { config } from "./common/Config";

async function bootstrap() {
  initializeWinston();

  const app = await NestFactory.create(AppModule, {
    logger: new CustomLogger("NestApplication"),
  });

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

function initializeWinston() {
  const { combine, timestamp, printf, colorize } = winston.format;

  const myFormat = printf(({ level, message, timestamp }) => {
    const m = moment(timestamp);
    const formattedTimestamp = m.format("YYYY-MM-DD HH:mm:ss.SSS");
    return `${formattedTimestamp} | ${level}: ${message}`;
  });

  winston.configure({
    level: "debug",
    format: combine(timestamp(), colorize({ all: true }), myFormat),
    transports: [new winston.transports.Console()],
  });
}
