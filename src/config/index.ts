import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config();

// Knex CLI migrations
process.env.NODE_CONFIG_DIR =
  process.env.NODE_CONFIG_DIR ?? path.join(__dirname, "../../config");

import * as configPackage from "config";

export interface Config {
  appName: string;
  appVersion: string;
  env: string;
  port: number;
  apiKey: string;
  db: Db;
  swagger: Swagger;
  rateLimit: RateLimit;
  cors: Cors;
  validator: Validator;
  logging: Logging;
  fileUpload: {
    maxSize: number;
    uploadDir: string;
    removeAfterUpload: string;
  };
  instrumentation: {
    enabled: boolean;
    debug: boolean;
    tracing: {
      enabled: boolean;
      url: string;
    };
    metrics: {
      enabled: boolean;
      url: string;
    };
    logs: {
      enabled: boolean;
      url: string;
      logData: boolean;
    };
  };
}

interface Db {
  url: string;
  logQueries: boolean;
}

interface Swagger {
  enabled: boolean;
  endpoint: string;
}

interface RateLimit {
  enabled: boolean;
  max: number;
  timeWindow: number;
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
