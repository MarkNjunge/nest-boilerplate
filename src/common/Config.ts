require("dotenv").config();
import * as configPackage from "config";

export interface Config {
  env: string;
  port: number;
}

export const config: Config = configPackage;
