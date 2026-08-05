import type { Sql } from "postgres";

import type { CountryCode, CountryScopedId } from "@afyabridge/shared";

export interface HouseholdSyncScope {
  country: CountryCode;
  programmeId: CountryScopedId;
  facilityId?: CountryScopedId;
  assignmentId?: CountryScopedId;
}

export interface ApplyHouseholdSyncInput extends HouseholdSyncScope {
  householdId: CountryScopedId;
  displayName: string;
  baseVersion: number;
  action: "create" | "update";
}

export type ApplyHouseholdSyncResult =
  | { status: "applied"; version: number }
  | { status: "conflict"; reason: "already_exists" | "missing" | "version_mismatch" };

export async function applyHouseholdSyncMutation(
  sql: Sql,
  input: ApplyHouseholdSyncInput
): Promise<ApplyHouseholdSyncResult> {
  return sql.begin(async (tx) => {
    if (input.action === "create") {
      if (input.baseVersion !== 0) {
        return { status: "conflict", reason: "version_mismatch" } as const;
      }

      const rows = await tx<{ version: number }[]>`
        INSERT INTO households (
          household_id,
          country,
          programme_id,
          facility_id,
          assignment_id,
          display_name,
          version
        )
        VALUES (
          ${input.householdId},
          ${input.country},
          ${input.programmeId},
          ${input.facilityId ?? null},
          ${input.assignmentId ?? null},
          ${input.displayName},
          1
        )
        ON CONFLICT (household_id) DO NOTHING
        RETURNING version
      `;

      return rows[0]
        ? { status: "applied", version: rows[0].version }
        : { status: "conflict", reason: "already_exists" };
    }

    const rows = await tx<{ version: number }[]>`
      UPDATE households
      SET
        display_name = ${input.displayName},
        version = version + 1,
        updated_at = now()
      WHERE household_id = ${input.householdId}
        AND country = ${input.country}
        AND programme_id = ${input.programmeId}
        AND (${input.facilityId ?? null}::text IS NULL OR facility_id = ${input.facilityId ?? null})
        AND (${input.assignmentId ?? null}::text IS NULL OR assignment_id = ${input.assignmentId ?? null})
        AND version = ${input.baseVersion}
      RETURNING version
    `;

    if (rows[0]) {
      return { status: "applied", version: rows[0].version };
    }

    const existing = await tx<{ version: number }[]>`
      SELECT version
      FROM households
      WHERE household_id = ${input.householdId}
        AND country = ${input.country}
        AND programme_id = ${input.programmeId}
        AND (${input.facilityId ?? null}::text IS NULL OR facility_id = ${input.facilityId ?? null})
        AND (${input.assignmentId ?? null}::text IS NULL OR assignment_id = ${input.assignmentId ?? null})
      LIMIT 1
    `;

    return existing[0]
      ? { status: "conflict", reason: "version_mismatch" }
      : { status: "conflict", reason: "missing" };
  });
}
