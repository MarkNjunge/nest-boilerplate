import { FastifyRequest } from "fastify";

export function extractIp(request: FastifyRequest): string {
  return (request.headers["x-real-ip"] ?? request.headers["x-forwarded-for"] ?? request.ip) as string;
}
