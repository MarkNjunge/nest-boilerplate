import { FastifyReply, FastifyRequest } from "fastify";
import * as dayjs from "dayjs";

export function requestTimeMiddleware(
  request: FastifyRequest,
  _response: FastifyReply,
  next: Function,
) {
  request.headers["x-request-time"] = dayjs().unix().toString();
  next();
}
