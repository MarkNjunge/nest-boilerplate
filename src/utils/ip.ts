import { FastifyRequest } from "fastify";

export function extractIp(request: FastifyRequest): string {
  const headers = request.headers;
  let ip = request.ip;
  if (headers["cf-connecting-ip"]) {
    ip = headers["cf-connecting-ip"] as string;
  } else if (headers["x-real-ip"]) {
    ip = headers["x-real-ip"] as string;
  } else if (headers["x-forwarded-for"]) {
    ip = (headers["x-forwarded-for"] as string).split(",")[0];
  }
  return ip;
}
