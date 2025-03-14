import { ClsModuleOptions, ClsService, ClsStore } from "nestjs-cls";
import * as crypto from "crypto";
import { extractIp } from "@/utils";
import opentelemetry from "@opentelemetry/api";
import { FastifyRequest } from "fastify";

export const CLS_REQ_TIME = "requestTime";
export const CLS_REQ_IP = "ip";

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
        return crypto.randomBytes(8).toString("hex");
      }
    },
    setup: (cls: AppClsService, req: FastifyRequest) => {
      cls.set(CLS_REQ_TIME, Date.now());
      cls.set(CLS_REQ_IP, extractIp(req));
    }
  }
};

export interface AppClsStore extends ClsStore {
  [CLS_REQ_TIME]: number;
  [CLS_REQ_IP]: string;
}

export type AppClsService = ClsService<AppClsStore>;
