import * as configPackage from "config";
import { Logger } from "@/logging/Logger";
import { deepMerge } from "@/utils/deep-merge";
import { loadSecrets } from "@/config/secrets-manager";

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
    sampleRatio: number;
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
  test: {
    db: "sqlite" | "postgres";
    logQueries: boolean;
  };
}

interface Db {
  url: string;
  poolSize: number;
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

export async function initializeConfig(): Promise<{ config: Config; success: boolean; }> {
  const baseConfig = configPackage as Config;

  // Get secrets
  const secrets = await loadSecrets();

  const configWithSecrets = deepMerge(baseConfig, secrets);

  // Mutate the existing config object in-place so all references see the changes.
  // This is necessary because other modules capture `config` at import time,
  // and reassigning the variable wouldn't update their references.
  for (const key of Object.keys(configWithSecrets)) {
    (config as any)[key] = configWithSecrets[key];
  }

  return { config: configWithSecrets, success: true };
}
