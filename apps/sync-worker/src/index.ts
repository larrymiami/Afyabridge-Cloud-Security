import { getDatabase } from "@afyabridge/database";
import {
  claimSyncOperation,
  completeSyncOperation,
} from "@afyabridge/database/src/repositories/sync-operations";
import { parseAuthenticatedActor } from "@afyabridge/auth";
import {
  authorizeSyncOperation,
  parseSyncOperation,
  type SyncDeviceBinding,
} from "@afyabridge/sync";

export interface SyncEnvelope {
  actor: unknown;
  binding: SyncDeviceBinding;
  operation: unknown;
}

export async function processSyncEnvelope(envelope: SyncEnvelope): Promise<{
  status: "applied" | "duplicate" | "rejected" | "conflict";
  code?: string;
}> {
  const actor = parseAuthenticatedActor(envelope.actor);
  const operation = parseSyncOperation(envelope.operation);
  const decision = authorizeSyncOperation(actor, envelope.binding, operation);

  if (!decision.allowed) {
    return { status: "rejected", code: decision.reason };
  }

  const sql = getDatabase();
  const claim = await claimSyncOperation(sql, actor.actorId, operation);

  if (claim.status === "duplicate") {
    return { status: "duplicate" };
  }

  if (claim.status !== "claimed") {
    return { status: "rejected", code: claim.status };
  }

  try {
    // Entity-specific mutation logic will use baseVersion in the same transaction
    // as the update. Until that repository is added, preserve the accepted
    // operation as a controlled conflict rather than applying an unsafe write.
    await completeSyncOperation(sql, operation.operationId, {
      status: "conflict",
      code: "ENTITY_MUTATION_NOT_IMPLEMENTED",
    });
    return { status: "conflict", code: "ENTITY_MUTATION_NOT_IMPLEMENTED" };
  } catch {
    await completeSyncOperation(sql, operation.operationId, {
      status: "rejected",
      code: "PROCESSING_FAILED",
    });
    return { status: "rejected", code: "PROCESSING_FAILED" };
  }
}
