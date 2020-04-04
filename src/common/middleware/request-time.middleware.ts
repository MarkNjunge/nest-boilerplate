import { FastifyReply, FastifyRequest } from "fastify";
import { ServerResponse, IncomingMessage } from "http";
import * as moment from "moment";

export function requestTimeMiddleware(
  request: FastifyRequest<IncomingMessage>,
  _response: FastifyReply<ServerResponse>,
  next: Function,
) {
  const requestTime = moment().valueOf();
  request.headers["x-request-time"] = requestTime;
  next();
}
