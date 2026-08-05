import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });

const households = [
  {
    id: "KE_household_demo_001",
    country: "KE",
    programmeId: "KE_programme_demo",
    facilityId: "KE_facility_nairobi",
    assignmentId: "KE_assignment_demo",
    displayName: "Synthetic Kenya Household"
  },
  {
    id: "GH_household_demo_001",
    country: "GH",
    programmeId: "GH_programme_demo",
    facilityId: "GH_facility_accra",
    assignmentId: "GH_assignment_demo",
    displayName: "Synthetic Ghana Household"
  },
  {
    id: "ZA_household_demo_001",
    country: "ZA",
    programmeId: "ZA_programme_demo",
    facilityId: "ZA_facility_johannesburg",
    assignmentId: "ZA_assignment_demo",
    displayName: "Synthetic South Africa Household"
  }
];

try {
  for (const household of households) {
    await sql`
      insert into households (
        id,
        country,
        programme_id,
        facility_id,
        assignment_id,
        display_name,
        version
      ) values (
        ${household.id},
        ${household.country},
        ${household.programmeId},
        ${household.facilityId},
        ${household.assignmentId},
        ${household.displayName},
        1
      )
      on conflict (id) do update set
        display_name = excluded.display_name,
        updated_at = now()
    `;
  }

  console.log(`Seeded ${households.length} synthetic households`);
} finally {
  await sql.end({ timeout: 5 });
}
