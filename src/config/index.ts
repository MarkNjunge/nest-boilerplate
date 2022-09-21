import * as dotenv from "dotenv";

dotenv.config();
import * as configPackage from "config";

interface Config {
  env: string;
  port: number;
  apiKey: string;
  db: Db;
  swagger: Swagger;
  rateLimit: RateLimit;
  cors: Cors;
  validator: Validator;
  logging: Logging;
}

interface Db {
  url: string;
  ssl: boolean;
}

interface Swagger {
  enabled: boolean;
  endpoint: string;
  title: string;
  description: string;
  contact: SwaggerContact;
}

interface SwaggerContact {
  name: string;
  url: string;
  email: string;
}

interface RateLimit {
  enabled: boolean;
  max: number;
  timeWindow: string;
}

interface Cors {
  origins: string;
  methods: string;
  allowedHeaders: string;
}

interface Validator {
  forbidUnknown: true;
}

interface Logging {
  timestampFormat: string;
  logDataConsole: boolean;
}

export const config: Config = configPackage as Config;

export function bool(value: boolean | string): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  return value === "true";

}
