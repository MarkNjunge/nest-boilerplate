import { execSync } from "child_process";

const [, , command, name] = process.argv;
const dataSource = "dist/src/modules/_db/data-source.js";
const migrationsDir = "src/db/migrations";

function run(cmd: string, clearNodeOptions = false) {
  const env = clearNodeOptions ? { ...process.env, NODE_OPTIONS: "" } : process.env;
  execSync(cmd, { stdio: "inherit", env });
}

switch (command) {
  case "create": {
    const migrationName = name || "new_migration";
    run(`typeorm-ts-node-commonjs migration:create ${migrationsDir}/${migrationName}`, true);
    break;
  }
  case "generate": {
    const migrationName = name || "new_migration";
    run("npm run build");
    run(`typeorm-ts-node-commonjs migration:generate -d ${dataSource} ${migrationsDir}/${migrationName}`);
    break;
  }
  case "up":
    run("npm run build");
    run(`typeorm-ts-node-commonjs migration:run -d ${dataSource}`);
    break;
  case "down":
    run("npm run build");
    run(`typeorm-ts-node-commonjs migration:revert -d ${dataSource}`);
    break;
  default:
    console.error("Usage: npm run migration <create|generate|up|down> [name]");
    process.exit(1);
}
