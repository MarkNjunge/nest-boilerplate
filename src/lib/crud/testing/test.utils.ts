import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis";
import { config } from "@/config";
import { DataSourceOptions } from "typeorm";

export async function createPostgresTestContainer(): Promise<{ container: StartedPostgreSqlContainer; opts: DataSourceOptions }> {
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

export async function createRedisTestContainer(): Promise<{ container: StartedRedisContainer; url: string }> {
  const container = await new RedisContainer(config.integrationTest.redisImage).start();
  const url = `redis://${container.getHost()}:${container.getPort()}`;
  return {
    container,
    url
  };
}
