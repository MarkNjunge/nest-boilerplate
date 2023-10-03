import { SetMetadata } from "@nestjs/common";
import { ClassConstructor } from "class-transformer";

export const CleanResponseKey = "CleanResponse";

export const CleanResponse = (clz: ClassConstructor<any>) =>
  SetMetadata(CleanResponseKey, clz);
