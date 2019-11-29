import * as dotenv from "dotenv";
dotenv.config();
import * as configPackage from "config";

export interface Config {
  env: string;
  port: number;
  swaggerEndpoint: string;
  rateLimit: RateLimit;
  corsOrigin: string;
  corsMethods: string;
  corsHeaders: string;
  validatorForbidUnknown: boolean;
  loggerTimestampFormat: string;
}

interface RateLimit {
  enabled: boolean;
  max: number;
  timeWindow: string;
}

export const config: Config = configPackage;
