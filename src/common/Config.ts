// I was having issues getting import to work
require("dotenv").config(); // tslint:disable-line
import * as configPackage from "config";

export interface Config {
  env: string;
  port: number;
}

export const config: Config = configPackage;
