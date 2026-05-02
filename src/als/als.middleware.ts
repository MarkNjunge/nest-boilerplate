import opentelemetry from "@opentelemetry/api";
import * as crypto from "crypto";
import { appAls, AppAlsStore, ALS_REQ_TIME } from "./app-als.service";
import { FastifyReply, FastifyRequest } from "fastify";

export function appAlsMiddleware(
  _request: FastifyRequest,
  _response: FastifyReply,
  next: () => void,
): void {
  const activeSpan = opentelemetry.trace.getActiveSpan();
  const id = activeSpan ?
    activeSpan.spanContext().traceId :
    `ctx_${crypto.randomBytes(8).toString("hex")}`;

  const store: AppAlsStore = { id, [ALS_REQ_TIME]: Date.now() };
  appAls.run(store, next);
}
