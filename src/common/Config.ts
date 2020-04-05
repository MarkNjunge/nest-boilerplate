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
  origin: string;
  methods: string;
  allowedHeaders: string;
}

interface Validator {
  forbidUnknown: true;
}

interface Logging {
  timestampFormat: string;
  sensitiveParams: string[];
  replacementString: string;
}

export const config: Config = configPackage;

// Handle environment variables being set as strings instead of boolean
export function configAsBoolean(value: boolean | string) {
  let valueBool: boolean;
  if (typeof value === "string") {
    valueBool = value === "true" ? true : false;
  } else if (typeof value === "boolean") {
    valueBool = value;
  }

  return valueBool;
}
