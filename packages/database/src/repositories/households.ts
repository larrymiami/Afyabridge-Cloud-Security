import type { Sql } from "postgres";
import type { AuthenticatedActor, CountryScopedId } from "@afyabridge/shared";
import type { HouseholdRow, NewHouseholdRow } from "../schema/households";

export class HouseholdRepository {
  constructor(private readonly sql: Sql) {}

  async create(input: NewHouseholdRow): Promise<HouseholdRow> {
    const [row] = await this.sql<HouseholdRow[]>`
      INSERT INTO households (
        id, country, programme_id, facility_id, assignment_id,
        display_name, created_by
      ) VALUES (
        ${input.id}, ${input.country}, ${input.programmeId},
        ${input.facilityId ?? null}, ${input.assignmentId},
        ${input.displayName}, ${input.createdBy}
      )
      RETURNING
        id,
        country,
        programme_id AS "programmeId",
        facility_id AS "facilityId",
        assignment_id AS "assignmentId",
        display_name AS "displayName",
        created_by AS "createdBy",
        created_at AS "createdAt"
    `;

    if (!row) throw new Error("Household insert returned no row");
    return row;
  }

  async findAuthorizedById(
    actor: AuthenticatedActor,
    householdId: CountryScopedId
  ): Promise<HouseholdRow | undefined> {
    const [row] = await this.sql<HouseholdRow[]>`
      SELECT
        id,
        country,
        programme_id AS "programmeId",
        facility_id AS "facilityId",
        assignment_id AS "assignmentId",
        display_name AS "displayName",
        created_by AS "createdBy",
        created_at AS "createdAt"
      FROM households
      WHERE id = ${householdId}
        AND country = ${actor.scope.country}
        AND programme_id = ${actor.scope.programmeId}
        AND assignment_id = ANY(${this.sql.array([...actor.scope.assignmentIds])})
        AND (
          ${actor.scope.facilityId ?? null}::text IS NULL
          OR facility_id = ${actor.scope.facilityId ?? null}
        )
      LIMIT 1
    `;

    return row;
  }
}
