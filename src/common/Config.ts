import * as dotenv from "dotenv";
dotenv.config();
import * as configPackage from "config";

export interface Config {
  env: string;
  port: number;
  swagger: Swagger;
  rateLimit: RateLimit;
  corsOrigin: string;
  corsMethods: string;
  corsHeaders: string;
  validatorForbidUnknown: boolean;
  loggerTimestampFormat: string;
}

export class Swagger {
  enabled: boolean;
  endpoint: string;
}

interface RateLimit {
  enabled: boolean;
  max: number;
  timeWindow: string;
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
