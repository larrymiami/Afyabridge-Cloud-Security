import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import postgres, { type Sql } from "postgres";

let sql: Sql;

before(async () => {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL must be configured");
  sql = postgres(databaseUrl, { max: 1, prepare: false });
});

after(async () => {
  await sql.end({ timeout: 5 });
});

test("country constraints reject mismatched identifiers", async () => {
  await assert.rejects(
    sql`
      insert into households (
        id,
        country,
        programme_id,
        facility_id,
        assignment_id,
        display_name,
        version
      ) values (
        'GH_household_invalid_country',
        'KE',
        'KE_programme_demo',
        'KE_facility_nairobi',
        'KE_assignment_demo',
        'Invalid synthetic household',
        1
      )
    `
  );
});

test("country and programme predicates prevent cross-scope reads", async () => {
  const visible = await sql`
    select id
    from households
    where id = 'KE_household_demo_001'
      and country = 'KE'
      and programme_id = 'KE_programme_demo'
  `;

  const hidden = await sql`
    select id
    from households
    where id = 'KE_household_demo_001'
      and country = 'GH'
      and programme_id = 'GH_programme_demo'
  `;

  assert.equal(visible.length, 1);
  assert.equal(hidden.length, 0);
});

test("optimistic version predicates reject stale updates", async () => {
  const result = await sql`
    update households
    set display_name = 'Stale update',
        version = version + 1,
        updated_at = now()
    where id = 'KE_household_demo_001'
      and country = 'KE'
      and programme_id = 'KE_programme_demo'
      and version = 999
    returning id
  `;

  assert.equal(result.length, 0);
});
