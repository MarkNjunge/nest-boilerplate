import { FastifyReply, FastifyRequest } from "fastify";
import * as dayjs from "dayjs";
import * as crypto from "crypto";
import { extractIp } from "@/utils";

export function globalMiddleware(
  request: FastifyRequest,
  _response: FastifyReply,
  // eslint-disable-next-line @typescript-eslint/ban-types
  next: Function,
): void {
  const correlationId = crypto.randomBytes(8).toString("hex");
  const ip = extractIp(request);

  request.headers["x-request-time"] = dayjs().valueOf().toString();
  request.headers["x-correlation-id"] = correlationId;
  request.headers["x-ip"] = ip;
  request.params = { correlationId, ip };

  next();
}
