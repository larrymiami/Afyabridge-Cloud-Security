import { describe, expect, it } from "vitest";
import { AuthenticationError, parseAuthenticatedActor } from "../src/index";

describe("parseAuthenticatedActor", () => {
  it("accepts a valid country-scoped workforce actor", () => {
    const actor = parseAuthenticatedActor({
      actorId: "worker-1",
      actorType: "workforce",
      roles: ["community-health-worker"],
      country: "KE",
      programmeId: "KE_programme-1",
      facilityId: "KE_facility-1",
      assignmentIds: ["KE_assignment-1"],
    });

    expect(actor.scope.country).toBe("KE");
  });

  it("rejects cross-country programme scope", () => {
    expect(() =>
      parseAuthenticatedActor({
        actorId: "worker-1",
        actorType: "workforce",
        roles: ["community-health-worker"],
        country: "KE",
        programmeId: "GH_programme-1",
        assignmentIds: [],
      })
    ).toThrow(AuthenticationError);
  });

  it("rejects empty roles", () => {
    expect(() =>
      parseAuthenticatedActor({
        actorId: "worker-1",
        actorType: "workforce",
        roles: [],
        country: "KE",
        programmeId: "KE_programme-1",
        assignmentIds: [],
      })
    ).toThrow(AuthenticationError);
  });
});
