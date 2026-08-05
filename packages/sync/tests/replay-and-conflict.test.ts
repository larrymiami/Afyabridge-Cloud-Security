import assert from "node:assert/strict";
import test from "node:test";

import { authorizeSyncOperation, parseSyncOperation } from "../src/index";

const actor = {
  actorId: "worker-1",
  actorType: "workforce" as const,
  roles: ["community-health-worker"],
  scope: {
    country: "KE" as const,
    programmeId: "KE_programme-1" as const,
    facilityId: "KE_facility-1" as const,
    assignmentIds: ["KE_assignment-1" as const],
  },
};

const binding = {
  deviceId: "device-0001",
  actorId: actor.actorId,
  country: actor.scope.country,
  programmeId: actor.scope.programmeId,
  facilityId: actor.scope.facilityId,
  assignmentIds: actor.scope.assignmentIds,
};

function operation(overrides: Record<string, unknown> = {}) {
  return parseSyncOperation({
    operationId: "3d9966a4-c50e-4435-86eb-0a4ea5093db1",
    deviceId: binding.deviceId,
    sequence: 8,
    country: "KE",
    programmeId: "KE_programme-1",
    facilityId: "KE_facility-1",
    assignmentId: "KE_assignment-1",
    entityType: "household",
    entityId: "KE_household-1",
    action: "update",
    baseVersion: 3,
    occurredAt: "2026-08-05T08:00:00.000Z",
    payload: { displayName: "Synthetic Household" },
    ...overrides,
  });
}

test("accepts an operation within the replay window", () => {
  const decision = authorizeSyncOperation(
    actor,
    binding,
    operation(),
    new Date("2026-08-05T08:04:00.000Z")
  );

  assert.deepEqual(decision, { allowed: true, reason: "allowed" });
});

test("rejects operations too far in the future", () => {
  const decision = authorizeSyncOperation(
    actor,
    binding,
    operation({ occurredAt: "2026-08-05T08:20:00.000Z" }),
    new Date("2026-08-05T08:00:00.000Z")
  );

  assert.deepEqual(decision, { allowed: false, reason: "future_timestamp" });
});

test("rejects operations outside the accepted offline age", () => {
  const decision = authorizeSyncOperation(
    actor,
    binding,
    operation({ occurredAt: "2026-06-01T08:00:00.000Z" }),
    new Date("2026-08-05T08:00:00.000Z")
  );

  assert.deepEqual(decision, { allowed: false, reason: "stale_timestamp" });
});

test("requires a non-negative optimistic concurrency version", () => {
  assert.throws(() => operation({ baseVersion: -1 }));
});

test("requires a monotonically representable non-negative sequence", () => {
  assert.throws(() => operation({ sequence: -1 }));
});
