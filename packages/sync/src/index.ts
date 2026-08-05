import { z } from "zod";

import type {
  AuthenticatedActor,
  CountryCode,
  CountryScopedId,
} from "@afyabridge/shared";

const countryScopedIdSchema = z
  .string()
  .min(4)
  .refine((value) => /^(KE|GH|ZA)_[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value), {
    message: "Expected a country-scoped identifier",
  });

export const syncOperationSchema = z.object({
  operationId: z.string().uuid(),
  deviceId: z.string().min(8).max(128),
  sequence: z.number().int().nonnegative(),
  country: z.enum(["KE", "GH", "ZA"]),
  programmeId: countryScopedIdSchema,
  facilityId: countryScopedIdSchema.optional(),
  assignmentId: countryScopedIdSchema.optional(),
  entityType: z.enum(["household"]),
  entityId: countryScopedIdSchema,
  action: z.enum(["create", "update"]),
  baseVersion: z.number().int().nonnegative(),
  occurredAt: z.string().datetime({ offset: true }),
  payload: z.record(z.string(), z.unknown()),
});

export type SyncOperation = z.infer<typeof syncOperationSchema>;

export interface SyncDeviceBinding {
  deviceId: string;
  actorId: string;
  country: CountryCode;
  programmeId: CountryScopedId;
  facilityId?: CountryScopedId;
  assignmentIds: readonly CountryScopedId[];
  revokedAt?: Date;
}

export type SyncDecision =
  | { allowed: true; reason: "allowed" }
  | {
      allowed: false;
      reason:
        | "device_revoked"
        | "actor_mismatch"
        | "device_mismatch"
        | "country_mismatch"
        | "programme_mismatch"
        | "facility_mismatch"
        | "assignment_mismatch"
        | "identifier_mismatch"
        | "future_timestamp"
        | "stale_timestamp";
    };

function scopedToCountry(value: string, country: CountryCode): boolean {
  return value.startsWith(`${country}_`);
}

export function authorizeSyncOperation(
  actor: AuthenticatedActor,
  binding: SyncDeviceBinding,
  operation: SyncOperation,
  now = new Date()
): SyncDecision {
  if (binding.revokedAt) return { allowed: false, reason: "device_revoked" };
  if (binding.actorId !== actor.actorId) return { allowed: false, reason: "actor_mismatch" };
  if (binding.deviceId !== operation.deviceId) return { allowed: false, reason: "device_mismatch" };
  if (actor.scope.country !== operation.country || binding.country !== operation.country) {
    return { allowed: false, reason: "country_mismatch" };
  }
  if (
    actor.scope.programmeId !== operation.programmeId ||
    binding.programmeId !== operation.programmeId
  ) {
    return { allowed: false, reason: "programme_mismatch" };
  }
  if (
    operation.facilityId &&
    (actor.scope.facilityId !== operation.facilityId ||
      binding.facilityId !== operation.facilityId)
  ) {
    return { allowed: false, reason: "facility_mismatch" };
  }
  if (
    operation.assignmentId &&
    (!actor.scope.assignmentIds.includes(operation.assignmentId) ||
      !binding.assignmentIds.includes(operation.assignmentId))
  ) {
    return { allowed: false, reason: "assignment_mismatch" };
  }
  if (
    !scopedToCountry(operation.programmeId, operation.country) ||
    !scopedToCountry(operation.entityId, operation.country) ||
    (operation.facilityId && !scopedToCountry(operation.facilityId, operation.country)) ||
    (operation.assignmentId && !scopedToCountry(operation.assignmentId, operation.country))
  ) {
    return { allowed: false, reason: "identifier_mismatch" };
  }

  const occurredAt = new Date(operation.occurredAt);
  const ageMs = now.getTime() - occurredAt.getTime();
  if (ageMs < -5 * 60_000) return { allowed: false, reason: "future_timestamp" };
  if (ageMs > 30 * 24 * 60 * 60_000) return { allowed: false, reason: "stale_timestamp" };

  return { allowed: true, reason: "allowed" };
}

export function parseSyncOperation(input: unknown): SyncOperation {
  return syncOperationSchema.parse(input);
}
