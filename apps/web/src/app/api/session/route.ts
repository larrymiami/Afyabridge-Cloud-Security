import { createAuditEvent, ConsoleAuditSink } from "@afyabridge/audit";

import {
  getSecurityRequestContext,
  securityErrorResponse,
} from "../../../lib/security/request-context";

const auditSink = new ConsoleAuditSink();

export async function GET(request: Request): Promise<Response> {
  try {
    const { actor, requestId } = await getSecurityRequestContext();

    await auditSink.write(
      createAuditEvent({
        actor,
        action: "session:read",
        outcome: "success",
        requestId,
        method: request.method,
        path: new URL(request.url).pathname,
        resourceType: "session",
      })
    );

    return Response.json(
      {
        actor: {
          actorId: actor.actorId,
          actorType: actor.actorType,
          roles: actor.roles,
          scope: actor.scope,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return securityErrorResponse(error);
  }
}
