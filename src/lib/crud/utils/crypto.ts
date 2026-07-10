import * as crypto from "crypto";

export function sha1(str: string): string {
  const hash = crypto.createHash("sha1");
  hash.update(str);
  return hash.digest().toString("hex");
}

export function sha1Obj(obj: any): string {
  return sha1(JSON.stringify(obj));
}
