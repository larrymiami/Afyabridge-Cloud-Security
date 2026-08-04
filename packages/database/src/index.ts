import { getEnvironment } from "@afyabridge/config";
import postgres, { type Sql } from "postgres";

let client: Sql | undefined;

export function getDatabase(): Sql {
  if (client) {
    return client;
  }

  const environment = getEnvironment();

  client = postgres(environment.DATABASE_URL, {
    max: environment.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    onnotice: () => undefined
  });

  return client;
}

export async function closeDatabase(): Promise<void> {
  if (!client) {
    return;
  }

  await client.end({ timeout: 5 });
  client = undefined;
}
