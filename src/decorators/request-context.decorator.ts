import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";

export interface IReqCtx {
  correlationId: string;
  ip: string;
}

export const ReqCtx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IReqCtx => {
    const request: FastifyRequest = ctx.switchToHttp().getRequest();

    const correlationId = request.headers["x-correlation-id"] as string;
    const ip = request.headers["x-ip"] as string;

    return { correlationId, ip };
  },
);

export const emptyCtx = (): IReqCtx => ({ correlationId: "", ip: "" });
