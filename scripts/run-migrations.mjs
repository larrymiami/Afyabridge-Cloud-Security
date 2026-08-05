import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const migrationsDirectory = resolve("packages/database/migrations");
const sql = postgres(databaseUrl, { max: 1, prepare: false });

try {
  await sql`
    create table if not exists schema_migrations (
      migration_name text primary key,
      applied_at timestamptz not null default now()
    )
  `;

  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((file) => /^\d{4}_.+\.sql$/.test(file))
    .sort();

  for (const migrationFile of migrationFiles) {
    const existing = await sql`
      select migration_name
      from schema_migrations
      where migration_name = ${migrationFile}
    `;

    if (existing.length > 0) {
      continue;
    }

    const migrationSql = await readFile(
      resolve(migrationsDirectory, migrationFile),
      "utf8"
    );

    await sql.begin(async (transaction) => {
      await transaction.unsafe(migrationSql);
      await transaction`
        insert into schema_migrations (migration_name)
        values (${migrationFile})
      `;
    });

    console.log(`Applied ${migrationFile}`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
