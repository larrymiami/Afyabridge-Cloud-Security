import { createHash } from "node:crypto";

import type { Sql } from "postgres";

import type { SyncOperation } from "@afyabridge/sync";

export type SyncClaimResult =
  | { status: "claimed" }
  | { status: "duplicate"; existingStatus: string }
  | { status: "replay" }
  | { status: "unknown_device" }
  | { status: "revoked_device" };

function payloadHash(operation: SyncOperation): string {
  return createHash("sha256")
    .update(JSON.stringify(operation.payload))
    .digest("hex");
}

export async function claimSyncOperation(
  sql: Sql,
  actorId: string,
  operation: SyncOperation
): Promise<SyncClaimResult> {
  return sql.begin(async (transaction) => {
    const devices = await transaction<
      { actor_id: string; last_sequence: number; revoked_at: Date | null }[]
    >`
      SELECT actor_id, last_sequence, revoked_at
      FROM sync_devices
      WHERE device_id = ${operation.deviceId}
        AND country = ${operation.country}
        AND programme_id = ${operation.programmeId}
      FOR UPDATE
    `;

    const device = devices[0];
    if (!device) return { status: "unknown_device" };
    if (device.revoked_at) return { status: "revoked_device" };
    if (device.actor_id !== actorId || operation.sequence <= device.last_sequence) {
      return { status: "replay" };
    }

    const existing = await transaction<{ status: string }[]>`
      SELECT status FROM sync_operations
      WHERE operation_id = ${operation.operationId}
         OR (device_id = ${operation.deviceId} AND sequence = ${operation.sequence})
    `;
    if (existing[0]) {
      return { status: "duplicate", existingStatus: existing[0].status };
    }

    await transaction`
      INSERT INTO sync_operations (
        operation_id, device_id, actor_id, country, programme_id,
        entity_type, entity_id, action, sequence, base_version,
        payload_hash, status, occurred_at
      ) VALUES (
        ${operation.operationId}, ${operation.deviceId}, ${actorId},
        ${operation.country}, ${operation.programmeId}, ${operation.entityType},
        ${operation.entityId}, ${operation.action}, ${operation.sequence},
        ${operation.baseVersion}, ${payloadHash(operation)}, 'accepted',
        ${operation.occurredAt}
      )
    `;

    await transaction`
      UPDATE sync_devices
      SET last_sequence = ${operation.sequence}
      WHERE device_id = ${operation.deviceId}
    `;

    return { status: "claimed" };
  });
}

export async function completeSyncOperation(
  sql: Sql,
  operationId: string,
  result: { status: "applied" | "conflict" | "rejected"; version?: number; code?: string }
): Promise<void> {
  await sql`
    UPDATE sync_operations
    SET status = ${result.status},
        result_version = ${result.version ?? null},
        rejection_code = ${result.code ?? null},
        applied_at = CASE WHEN ${result.status} = 'applied' THEN now() ELSE applied_at END
    WHERE operation_id = ${operationId}
      AND status = 'accepted'
  `;
}
