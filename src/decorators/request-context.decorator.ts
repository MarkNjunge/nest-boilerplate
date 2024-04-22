import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import * as crypto from "crypto";

export interface IReqCtx {
  traceId: string;
  ip: string;
}

export const ReqCtx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IReqCtx => {
    const request: FastifyRequest = ctx.switchToHttp().getRequest();

    const traceId = request.headers["x-trace-id"] as string;
    const ip = request.headers["x-ip"] as string;

    return { traceId, ip };
  },
);

export const emptyCtx = (): IReqCtx => ({ traceId: crypto.randomBytes(8).toString("hex"), ip: "0.0.0.0" });
