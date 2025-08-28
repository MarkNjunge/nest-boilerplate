import { ClsModuleOptions, ClsService, ClsStore } from "nestjs-cls";
import * as crypto from "crypto";
import opentelemetry from "@opentelemetry/api";
import { FastifyRequest } from "fastify";

export const CLS_REQ_TIME = "requestTime";

export const appClsOptions: ClsModuleOptions = {
  global: true,
  middleware: {
    mount: true,
    generateId: true,
    idGenerator: () => {
      const activeSpan = opentelemetry.trace.getActiveSpan();
      if (activeSpan) {
        return activeSpan.spanContext().traceId;
      } else {
        return `ctx_${crypto.randomBytes(8).toString("hex")}`;
      }
    },
    setup: (cls: ClsService<AppClsStore>, req: FastifyRequest) => {
      cls.set(CLS_REQ_TIME, Date.now());
    }
  }
};

export interface AppClsStore extends ClsStore {
  [CLS_REQ_TIME]: number;
}
