import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { config } from "@/config";
import { DataSourceOptions } from "typeorm/data-source/DataSourceOptions";

export async function createTestContainer(): Promise<{ container: StartedPostgreSqlContainer; opts: DataSourceOptions }> {
  const container = await new PostgreSqlContainer(config.integrationTest.pgImage).start();
  const opts: DataSourceOptions = {
    type: "postgres",
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase()
  };

  return {
    container,
    opts
  };
}
