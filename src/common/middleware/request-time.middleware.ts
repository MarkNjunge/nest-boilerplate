import { FastifyReply, FastifyRequest } from "fastify";
import { ServerResponse, IncomingMessage } from "http";

export function requestTimeMiddleware(
  request: FastifyRequest<IncomingMessage>,
  _response: FastifyReply<ServerResponse>,
  next: Function,
) {
  const requestTime = Date.now();
  request.headers["x-request-time"] = requestTime;
  next();
}
