import * as fs from "node:fs";
import { loadEnvFile } from "node:process";

if (fs.existsSync(".env")) {
  loadEnvFile();
}
