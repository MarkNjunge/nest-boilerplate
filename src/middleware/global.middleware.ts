import { FastifyReply, FastifyRequest } from "fastify";
import * as dayjs from "dayjs";
import * as crypto from "crypto";
import { extractIp } from "@/utils";
import opentelemetry from "@opentelemetry/api";

export function globalMiddleware(
  request: FastifyRequest,
  _response: FastifyReply,
  // eslint-disable-next-line @typescript-eslint/ban-types
  next: Function,
): void {
  next();
}
