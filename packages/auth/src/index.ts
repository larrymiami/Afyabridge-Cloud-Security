import { z } from "zod";

import {
  countryCodes,
  type AuthenticatedActor,
  type CountryCode,
  type CountryScopedId,
} from "@afyabridge/shared";

const countryScopedIdSchema = z
  .string()
  .min(4)
  .refine((value) => /^(KE|GH|ZA)_[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value), {
    message: "Expected a country-scoped identifier",
  });

const actorSchema = z.object({
  actorId: z.string().min(1).max(128),
  actorType: z.enum(["workforce", "workload"]),
  roles: z.array(z.string().min(1).max(64)).min(1).max(16),
  country: z.enum(countryCodes),
  programmeId: countryScopedIdSchema,
  facilityId: countryScopedIdSchema.optional(),
  assignmentIds: z.array(countryScopedIdSchema).max(100).default([]),
});

export class AuthenticationError extends Error {
  readonly statusCode = 401;
  readonly code = "AUTHENTICATION_REQUIRED";

  constructor(message = "A valid authenticated actor is required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

function assertScopedToCountry(value: string, country: CountryCode): CountryScopedId {
  if (!value.startsWith(`${country}_`)) {
    throw new AuthenticationError("Actor scope contains a cross-country identifier");
  }

  return value as CountryScopedId;
}

export function parseAuthenticatedActor(input: unknown): AuthenticatedActor {
  const parsed = actorSchema.safeParse(input);

  if (!parsed.success) {
    throw new AuthenticationError();
  }

  const { country, programmeId, facilityId, assignmentIds, ...actor } = parsed.data;

  return {
    ...actor,
    scope: {
      country,
      programmeId: assertScopedToCountry(programmeId, country),
      ...(facilityId
        ? { facilityId: assertScopedToCountry(facilityId, country) }
        : {}),
      assignmentIds: assignmentIds.map((id) => assertScopedToCountry(id, country)),
    },
  };
}

export function requireWorkforceActor(actor: AuthenticatedActor): AuthenticatedActor {
  if (actor.actorType !== "workforce") {
    throw new AuthenticationError("A workforce identity is required");
  }

  return actor;
}
