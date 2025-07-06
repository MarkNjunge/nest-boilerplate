import { FastifyReply, FastifyRequest } from "fastify";

export function globalMiddleware(
  request: FastifyRequest,
  _response: FastifyReply,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  next: Function,
): void {
  next();
}
