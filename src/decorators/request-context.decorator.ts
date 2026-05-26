import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import * as crypto from "crypto";
import { appAls, ALS_AUTH_USER, ALS_AUTH_ADMIN } from "@/als/app-als.service";
import { AuthenticatedUser } from "@/models/auth/auth";

export interface IReqCtx {
  traceId: string;
  user?: AuthenticatedUser;
  isAdmin?: boolean;
}

export const ReqCtx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IReqCtx => {
    const store = appAls.getStore();
    return {
      traceId: store?.id ?? "00000",
      user: store?.[ALS_AUTH_USER],
      isAdmin: store?.[ALS_AUTH_ADMIN],
    };
  },
);

export const emptyCtx = (): IReqCtx => ({ traceId: crypto.randomBytes(8).toString("hex") });
