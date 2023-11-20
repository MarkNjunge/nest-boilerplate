import { SetMetadata } from "@nestjs/common";
import { ClassConstructor } from "class-transformer";

export const SerializeKey = "Serialize";

export const Serialize = (clz: ClassConstructor<any>) =>
  SetMetadata(SerializeKey, clz);
