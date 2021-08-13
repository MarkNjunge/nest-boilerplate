import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";

export const CorrelationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request: FastifyRequest = ctx.switchToHttp().getRequest();

    return request.headers["x-correlation-id"];
  },
);
