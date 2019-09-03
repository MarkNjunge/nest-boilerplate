import * as dotenv from "dotenv";
dotenv.config();
import * as configPackage from "config";

export interface Config {
  env: string;
  port: number;
  swaggerEndpoint: string;
  rateLimitMax: number;
  rateLimitTimeWindow: string;
  corsOrigin: string;
  corsMethods: string;
  corsHeaders: string;
  validatorForbidUnknown: boolean;
  loggerTimestampFormat: string;
}

export const config: Config = configPackage;
