import { headers } from "next/headers";

import {
  AuthenticationError,
  parseAuthenticatedActor,
} from "@afyabridge/auth";
import type { AuthenticatedActor } from "@afyabridge/shared";

const ACTOR_HEADER = "x-afyabridge-actor";
const REQUEST_ID_HEADER = "x-request-id";

export interface SecurityRequestContext {
  actor: AuthenticatedActor;
  requestId: string;
}

export async function getSecurityRequestContext(): Promise<SecurityRequestContext> {
  const requestHeaders = await headers();
  const actorHeader = requestHeaders.get(ACTOR_HEADER);

  if (!actorHeader) {
    throw new AuthenticationError();
  }

  let actorInput: unknown;
  try {
    actorInput = JSON.parse(actorHeader);
  } catch {
    throw new AuthenticationError("Authenticated actor context is malformed");
  }

  return {
    actor: parseAuthenticatedActor(actorInput),
    requestId: requestHeaders.get(REQUEST_ID_HEADER) ?? crypto.randomUUID(),
  };
}

export function securityErrorResponse(error: unknown): Response {
  const statusCode =
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
      ? error.statusCode
      : 500;

  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "INTERNAL_ERROR";

  return Response.json(
    {
      error: {
        code,
        message:
          statusCode === 500
            ? "The request could not be completed"
            : "The request was not authorized",
      },
    },
    {
      status: statusCode,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
