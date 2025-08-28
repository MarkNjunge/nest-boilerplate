import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import * as crypto from "crypto";
import { ClsServiceManager } from "nestjs-cls";

export interface IReqCtx {
  traceId: string;
}

export const ReqCtx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IReqCtx => {
    const clsService = ClsServiceManager.getClsService();

    const traceId = clsService.getId();

    return { traceId };
  },
);

export const emptyCtx = (): IReqCtx => ({ traceId: crypto.randomBytes(8).toString("hex") });
