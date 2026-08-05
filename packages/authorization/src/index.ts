import type {
  AuthenticatedActor,
  CountryCode,
  CountryScopedId,
} from "@afyabridge/shared";

export type Action =
  | "session:read"
  | "household:create"
  | "household:read"
  | "household:update";

export interface HouseholdResource {
  country: CountryCode;
  programmeId: CountryScopedId;
  facilityId?: CountryScopedId;
  assignmentId?: CountryScopedId;
}

export interface AuthorizationDecision {
  allowed: boolean;
  reason:
    | "allowed"
    | "missing_role"
    | "country_mismatch"
    | "programme_mismatch"
    | "facility_mismatch"
    | "assignment_mismatch"
    | "unsupported_action";
}

const roleActions: Readonly<Record<string, readonly Action[]>> = {
  "country-admin": [
    "session:read",
    "household:create",
    "household:read",
    "household:update",
  ],
  "programme-manager": [
    "session:read",
    "household:create",
    "household:read",
    "household:update",
  ],
  "community-health-worker": [
    "session:read",
    "household:create",
    "household:read",
    "household:update",
  ],
};

function actorSupportsAction(actor: AuthenticatedActor, action: Action): boolean {
  return actor.roles.some((role) => roleActions[role]?.includes(action));
}

export function authorizeHouseholdAction(
  actor: AuthenticatedActor,
  action: Action,
  resource: HouseholdResource
): AuthorizationDecision {
  if (!actorSupportsAction(actor, action)) {
    return { allowed: false, reason: "missing_role" };
  }

  if (actor.scope.country !== resource.country) {
    return { allowed: false, reason: "country_mismatch" };
  }

  if (actor.scope.programmeId !== resource.programmeId) {
    return { allowed: false, reason: "programme_mismatch" };
  }

  if (
    resource.facilityId &&
    actor.scope.facilityId &&
    actor.scope.facilityId !== resource.facilityId
  ) {
    return { allowed: false, reason: "facility_mismatch" };
  }

  if (
    resource.assignmentId &&
    !actor.scope.assignmentIds.includes(resource.assignmentId)
  ) {
    return { allowed: false, reason: "assignment_mismatch" };
  }

  return { allowed: true, reason: "allowed" };
}

export class AuthorizationError extends Error {
  readonly statusCode = 403;
  readonly code = "ACCESS_DENIED";

  constructor(readonly decision: AuthorizationDecision) {
    super("The actor is not authorized for this operation");
    this.name = "AuthorizationError";
  }
}

export function requireAuthorization(
  decision: AuthorizationDecision
): asserts decision is AuthorizationDecision & { allowed: true } {
  if (!decision.allowed) {
    throw new AuthorizationError(decision);
  }
}
