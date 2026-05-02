import { FastifyReply, FastifyRequest } from "fastify";

export function globalMiddleware(
  request: FastifyRequest,
  _response: FastifyReply,
  next: () => void,
): void {
  next();
}
