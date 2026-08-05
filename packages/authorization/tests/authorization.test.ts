import { describe, expect, it } from "vitest";
import { authorizeHouseholdAction } from "../src/index";
import type { AuthenticatedActor } from "@afyabridge/shared";

const actor: AuthenticatedActor = {
  actorId: "worker-1",
  actorType: "workforce",
  roles: ["community-health-worker"],
  scope: {
    country: "KE",
    programmeId: "KE_programme-1",
    facilityId: "KE_facility-1",
    assignmentIds: ["KE_assignment-1"],
  },
};

describe("authorizeHouseholdAction", () => {
  it("allows a matching assigned resource", () => {
    expect(
      authorizeHouseholdAction(actor, "household:read", {
        country: "KE",
        programmeId: "KE_programme-1",
        facilityId: "KE_facility-1",
        assignmentId: "KE_assignment-1",
      })
    ).toEqual({ allowed: true, reason: "allowed" });
  });

  it("denies a cross-country resource", () => {
    expect(
      authorizeHouseholdAction(actor, "household:read", {
        country: "GH",
        programmeId: "GH_programme-1",
      }).reason
    ).toBe("country_mismatch");
  });

  it("denies an unassigned household", () => {
    expect(
      authorizeHouseholdAction(actor, "household:read", {
        country: "KE",
        programmeId: "KE_programme-1",
        assignmentId: "KE_assignment-2",
      }).reason
    ).toBe("assignment_mismatch");
  });

  it("denies an unsupported role", () => {
    expect(
      authorizeHouseholdAction({ ...actor, roles: ["viewer"] }, "household:read", {
        country: "KE",
        programmeId: "KE_programme-1",
      }).reason
    ).toBe("missing_role");
  });
});
