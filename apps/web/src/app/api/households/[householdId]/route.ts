import { getDatabase } from "@afyabridge/database";
import { HouseholdRepository } from "@afyabridge/database/households";
import { authorizeHouseholdAction, requireAuthorization } from "@afyabridge/authorization";
import { isCountryScopedId } from "@afyabridge/shared";

import {
  getSecurityRequestContext,
  securityErrorResponse,
} from "../../../../lib/security/request-context";

interface RouteContext {
  params: Promise<{ householdId: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const { actor } = await getSecurityRequestContext();
    const { householdId } = await context.params;

    if (!isCountryScopedId(householdId, actor.scope.country)) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Household not found" } },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    requireAuthorization(
      authorizeHouseholdAction(actor, "household:read", {
        country: actor.scope.country,
        programmeId: actor.scope.programmeId,
        ...(actor.scope.facilityId
          ? { facilityId: actor.scope.facilityId }
          : {}),
      })
    );

    const repository = new HouseholdRepository(getDatabase());
    const household = await repository.findAuthorizedById(actor, householdId);

    if (!household) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Household not found" } },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return Response.json({ household }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return securityErrorResponse(error);
  }
}
