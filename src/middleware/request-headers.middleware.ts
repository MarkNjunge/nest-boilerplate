import { FastifyReply, FastifyRequest } from "fastify";
import * as dayjs from "dayjs";
import * as crypto from "crypto";

export function requestHeadersMiddleware(
  request: FastifyRequest,
  _response: FastifyReply,
  // eslint-disable-next-line @typescript-eslint/ban-types
  next: Function,
): void {
  request.headers["x-request-time"] = dayjs().valueOf()
    .toString();
  const correlationId = crypto.randomBytes(8).toString("hex");
  request.headers["x-correlation-id"] = correlationId;
  request.params = { correlationId };
  next();
}
