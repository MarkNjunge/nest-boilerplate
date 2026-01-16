import { execSync } from "child_process";

const [, , command, name] = process.argv;
const dataSource = "src/modules/_db/data-source.ts";
const migrationsDir = "src/db/migrations";

function run(cmd: string, clearNodeOptions = false) {
  const env = clearNodeOptions ? { ...process.env, NODE_OPTIONS: "" } : process.env;
  execSync(cmd, { stdio: "inherit", env });
}

function pregenerate() {
  run("swc src/models src/utils src/modules/_db/data-source.ts src/config -d dist --strip-leading-paths");
}

function preup() {
  run("swc src/db/migrations -d dist --strip-leading-paths");
}

switch (command) {
  case "create": {
    const migrationName = name || "new_migration";
    run(`typeorm-ts-node-commonjs migration:create ${migrationsDir}/${migrationName}`, true);
    break;
  }
  case "generate": {
    const migrationName = name || "new_migration";
    pregenerate();
    run(`typeorm-ts-node-commonjs migration:generate -d ${dataSource} ${migrationsDir}/${migrationName}`, true);
    break;
  }
  case "up":
    preup();
    run(`typeorm-ts-node-commonjs migration:run -d ${dataSource}`, true);
    break;
  case "down":
    run(`typeorm-ts-node-commonjs migration:revert -d ${dataSource}`, true);
    break;
  default:
    console.error("Usage: npm run migration <create|generate|up|down> [name]");
    process.exit(1);
}
