import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import * as crypto from "crypto";
import { AppClsService } from "@/cls/app-cls";
import { ClsServiceManager } from "nestjs-cls";

export interface IReqCtx {
  traceId: string;
  ip: string;
}

export const ReqCtx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IReqCtx => {
    const clsService: AppClsService = ClsServiceManager.getClsService();
    const request: FastifyRequest = ctx.switchToHttp().getRequest();

    const traceId = clsService.getId();
    const { ip } = clsService.get();

    return { traceId, ip };
  },
);

export const emptyCtx = (): IReqCtx => ({ traceId: crypto.randomBytes(8).toString("hex"), ip: "0.0.0.0" });
