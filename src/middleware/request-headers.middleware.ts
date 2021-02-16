import { FastifyReply, FastifyRequest } from "fastify";
import * as dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

export function requestHeadersMiddleware(
  request: FastifyRequest,
  _response: FastifyReply,
  // eslint-disable-next-line @typescript-eslint/ban-types
  next: Function,
): void {
  request.headers["x-request-time"] = dayjs().valueOf()
    .toString();
  request.headers["x-correlation-id"] = uuidv4();
  next();
}
