import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const args = process.argv.slice(2);

function getArg(flag: string, defaultValue: string): string {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue;
}

const jsonPath = resolve(getArg("--json", "./report.json"));
const outputPath = resolve(getArg("--output", "./report.html"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const scriptDir = dirname(fileURLToPath(import.meta.url));
const templatePath = resolve(scriptDir, "template.html");

const jsonData = readFileSync(jsonPath, "utf-8");
const template = readFileSync(templatePath, "utf-8");

const html = template.replace(
  "window.__ARTILLERY_REPORT__ = null;",
  "window.__ARTILLERY_REPORT__ = " + jsonData.trim() + ";",
);

writeFileSync(outputPath, html, "utf-8");
console.log(`Report generated: ${outputPath}`);
