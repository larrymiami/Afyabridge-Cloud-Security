import assert from "node:assert/strict";
import test from "node:test";

import { parseSyncOperation } from "@afyabridge/sync";

test("worker rejects unsupported entity types before persistence", () => {
  assert.throws(() =>
    parseSyncOperation({
      operationId: "e05b947c-823c-4494-b664-c83bbdf28ba6",
      deviceId: "device-0001",
      sequence: 1,
      country: "KE",
      programmeId: "KE_programme-1",
      entityType: "patient",
      entityId: "KE_patient-1",
      action: "create",
      baseVersion: 0,
      occurredAt: "2026-08-05T08:00:00.000Z",
      payload: {},
    })
  );
});

test("worker rejects malformed country-scoped identifiers", () => {
  assert.throws(() =>
    parseSyncOperation({
      operationId: "51287832-1320-463c-9abd-7fec69a1dc4c",
      deviceId: "device-0001",
      sequence: 1,
      country: "KE",
      programmeId: "GH_programme-1",
      entityType: "household",
      entityId: "KE_household-1",
      action: "create",
      baseVersion: 0,
      occurredAt: "2026-08-05T08:00:00.000Z",
      payload: {},
    })
  );
});
