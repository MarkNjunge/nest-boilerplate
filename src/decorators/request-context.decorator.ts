import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import * as crypto from "crypto";
import { ClsServiceManager } from "nestjs-cls";
import { AppClsStore, CLS_AUTH_USER } from "@/cls/app-cls";
import { AuthenticatedUser } from "@/models/auth/auth";

export interface IReqCtx {
  traceId: string;
  user?: AuthenticatedUser;
}

export const ReqCtx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IReqCtx => {
    const clsService = ClsServiceManager.getClsService<AppClsStore>();

    const traceId = clsService.getId();
    const user = clsService.get(CLS_AUTH_USER);

    return { traceId, user };
  },
);

export const emptyCtx = (): IReqCtx => ({ traceId: crypto.randomBytes(8).toString("hex") });
