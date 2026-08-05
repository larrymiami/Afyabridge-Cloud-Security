import { createAuditEvent, ConsoleAuditSink } from "@afyabridge/audit";
import {
  authorizeHouseholdAction,
  requireAuthorization,
} from "@afyabridge/authorization";
import { countryCodes, type CountryScopedId } from "@afyabridge/shared";
import { z } from "zod";

import {
  getSecurityRequestContext,
  securityErrorResponse,
} from "../../../lib/security/request-context";

const auditSink = new ConsoleAuditSink();

const createHouseholdSchema = z.object({
  country: z.enum(countryCodes),
  programmeId: z.string().min(4),
  facilityId: z.string().min(4).optional(),
  assignmentId: z.string().min(4).optional(),
  householdReference: z.string().min(3).max(64),
  village: z.string().min(1).max(120),
});

export async function POST(request: Request): Promise<Response> {
  let actorContext: Awaited<ReturnType<typeof getSecurityRequestContext>> | undefined;

  try {
    actorContext = await getSecurityRequestContext();
    const input = createHouseholdSchema.parse(await request.json());

    const decision = authorizeHouseholdAction(
      actorContext.actor,
      "household:create",
      {
        country: input.country,
        programmeId: input.programmeId as CountryScopedId,
        ...(input.facilityId
          ? { facilityId: input.facilityId as CountryScopedId }
          : {}),
        ...(input.assignmentId
          ? { assignmentId: input.assignmentId as CountryScopedId }
          : {}),
      }
    );

    requireAuthorization(decision);

    const householdId = `${input.country}_${crypto.randomUUID()}` as CountryScopedId;

    await auditSink.write(
      createAuditEvent({
        actor: actorContext.actor,
        action: "household:create",
        outcome: "success",
        requestId: actorContext.requestId,
        method: request.method,
        path: new URL(request.url).pathname,
        resourceType: "household",
        resourceId: householdId,
      })
    );

    return Response.json(
      {
        household: {
          id: householdId,
          country: input.country,
          programmeId: input.programmeId,
          ...(input.facilityId ? { facilityId: input.facilityId } : {}),
          ...(input.assignmentId ? { assignmentId: input.assignmentId } : {}),
          householdReference: input.householdReference,
          village: input.village,
          persistenceStatus: "not_yet_persisted",
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (actorContext) {
      await auditSink.write(
        createAuditEvent({
          actor: actorContext.actor,
          action: "household:create",
          outcome:
            typeof error === "object" &&
            error !== null &&
            "statusCode" in error &&
            error.statusCode === 403
              ? "denied"
              : "failure",
          requestId: actorContext.requestId,
          method: request.method,
          path: new URL(request.url).pathname,
          resourceType: "household",
          reason: error instanceof Error ? error.name : "unknown_error",
        })
      );
    }

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: { code: "INVALID_REQUEST", message: "Request validation failed" } },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    return securityErrorResponse(error);
  }
}
