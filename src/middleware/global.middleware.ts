import { FastifyReply, FastifyRequest } from "fastify";
import * as dayjs from "dayjs";
import * as crypto from "crypto";
import { extractIp } from "@/utils";
import opentelemetry from "@opentelemetry/api";

export function globalMiddleware(
  request: FastifyRequest,
  _response: FastifyReply,
  // eslint-disable-next-line @typescript-eslint/ban-types
  next: Function,
): void {
  let traceId = crypto.randomBytes(8).toString("hex");
  const ip = extractIp(request);

  const activeSpan = opentelemetry.trace.getActiveSpan();
  if (activeSpan) {
    traceId = activeSpan.spanContext().traceId;
  }

  request.headers["x-request-time"] = dayjs().valueOf().toString();
  request.headers["x-trace-id"] = traceId;
  request.headers["x-ip"] = ip;
  request.params = { traceId, ip };

  next();
}
