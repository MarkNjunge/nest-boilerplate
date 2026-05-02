import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";
import { AuthenticatedUser } from "@/models/auth/auth";

export const ALS_REQ_TIME = "requestTime";
export const ALS_AUTH_USER = "authUser";

export interface AppAlsStore {
  id: string;
  [ALS_REQ_TIME]?: number;
  [ALS_AUTH_USER]?: AuthenticatedUser;
}

export const appAls = new AsyncLocalStorage<AppAlsStore>();

@Injectable()
export class AppAlsService {
  getId(): string {
    return appAls.getStore()?.id ?? "00000";
  }

  get<K extends keyof AppAlsStore>(key: K): AppAlsStore[K] | undefined {
    return appAls.getStore()?.[key];
  }

  set<K extends keyof AppAlsStore>(key: K, value: AppAlsStore[K]): void {
    const store = appAls.getStore();
    if (store) store[key] = value;
  }
}
