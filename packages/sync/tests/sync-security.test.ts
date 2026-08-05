import assert from "node:assert/strict";
import test from "node:test";

import type { AuthenticatedActor } from "@afyabridge/shared";

import {
  authorizeSyncOperation,
  parseSyncOperation,
  type SyncDeviceBinding,
} from "../src/index.ts";

const actor: AuthenticatedActor = {
  actorId: "chw-001",
  actorType: "workforce",
  roles: ["community-health-worker"],
  scope: {
    country: "KE",
    programmeId: "KE_programme-1",
    facilityId: "KE_facility-1",
    assignmentIds: ["KE_assignment-1"],
  },
};

const binding: SyncDeviceBinding = {
  deviceId: "device-0001",
  actorId: actor.actorId,
  country: "KE",
  programmeId: "KE_programme-1",
  facilityId: "KE_facility-1",
  assignmentIds: ["KE_assignment-1"],
};

function operation(overrides: Record<string, unknown> = {}) {
  return parseSyncOperation({
    operationId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    deviceId: "device-0001",
    sequence: 1,
    country: "KE",
    programmeId: "KE_programme-1",
    facilityId: "KE_facility-1",
    assignmentId: "KE_assignment-1",
    entityType: "household",
    entityId: "KE_household-1",
    action: "update",
    baseVersion: 2,
    occurredAt: "2026-08-05T08:00:00.000Z",
    payload: { displayName: "Synthetic Household" },
    ...overrides,
  });
}

test("allows a device-bound in-scope operation", () => {
  const result = authorizeSyncOperation(
    actor,
    binding,
    operation(),
    new Date("2026-08-05T08:05:00.000Z")
  );
  assert.deepEqual(result, { allowed: true, reason: "allowed" });
});

test("rejects a different device", () => {
  const result = authorizeSyncOperation(
    actor,
    binding,
    operation({ deviceId: "device-9999" }),
    new Date("2026-08-05T08:05:00.000Z")
  );
  assert.equal(result.allowed, false);
  if (!result.allowed) assert.equal(result.reason, "device_mismatch");
});

test("rejects a cross-country entity identifier during parsing", () => {
  assert.throws(
    () => operation({ entityId: "GH_household-1" }),
    /Identifier does not match the operation country/
  );
});

test("rejects revoked devices", () => {
  const result = authorizeSyncOperation(
    actor,
    { ...binding, revokedAt: new Date("2026-08-05T07:00:00.000Z") },
    operation(),
    new Date("2026-08-05T08:05:00.000Z")
  );
  assert.equal(result.allowed, false);
  if (!result.allowed) assert.equal(result.reason, "device_revoked");
});
