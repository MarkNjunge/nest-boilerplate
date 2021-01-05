import { FastifyReply, FastifyRequest } from "fastify";
import * as dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

export function requestHeadersMiddleware(
  request: FastifyRequest,
  _response: FastifyReply,
  // eslint-disable-next-line @typescript-eslint/ban-types
  next: Function,
) {
  request.headers["x-request-time"] = dayjs().unix().toString();
  const correlationId = uuidv4();
  request.headers["x-correlation-id"] = correlationId;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  request.params = { correlationId };
  next();
}
