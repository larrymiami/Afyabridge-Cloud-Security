import type {
  AuthenticatedActor,
  CountryCode,
  CountryScopedId,
} from "@afyabridge/shared";

export type AuditOutcome = "success" | "denied" | "failure";

export interface AuditEvent {
  eventId: string;
  occurredAt: string;
  action: string;
  outcome: AuditOutcome;
  actor: {
    actorId: string;
    actorType: AuthenticatedActor["actorType"];
    roles: readonly string[];
  };
  scope: {
    country: CountryCode;
    programmeId: CountryScopedId;
    facilityId?: CountryScopedId;
  };
  resource?: {
    type: string;
    id?: string;
  };
  request: {
    requestId: string;
    method: string;
    path: string;
  };
  reason?: string;
}

export interface AuditSink {
  write(event: AuditEvent): Promise<void>;
}

export class ConsoleAuditSink implements AuditSink {
  async write(event: AuditEvent): Promise<void> {
    console.info(JSON.stringify({ type: "security_audit", ...event }));
  }
}

export function createAuditEvent(input: {
  actor: AuthenticatedActor;
  action: string;
  outcome: AuditOutcome;
  requestId: string;
  method: string;
  path: string;
  resourceType?: string;
  resourceId?: string;
  reason?: string;
}): AuditEvent {
  return {
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    action: input.action,
    outcome: input.outcome,
    actor: {
      actorId: input.actor.actorId,
      actorType: input.actor.actorType,
      roles: input.actor.roles,
    },
    scope: input.actor.scope,
    ...(input.resourceType
      ? {
          resource: {
            type: input.resourceType,
            ...(input.resourceId ? { id: input.resourceId } : {}),
          },
        }
      : {}),
    request: {
      requestId: input.requestId,
      method: input.method,
      path: input.path,
    },
    ...(input.reason ? { reason: input.reason } : {}),
  };
}
