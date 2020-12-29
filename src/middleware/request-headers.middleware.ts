import { FastifyReply, FastifyRequest } from "fastify";
import * as dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

export function requestHeadersMiddleware(
  request: FastifyRequest,
  _response: FastifyReply,
  next: Function,
) {
  request.headers["x-request-time"] = dayjs().unix().toString();
  request.headers["x-conversation-id"] = uuidv4();
  next();
}
