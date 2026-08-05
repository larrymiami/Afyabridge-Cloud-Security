import { expect, test } from "vitest";

import { AuthenticationError } from "@afyabridge/auth";
import { AuthorizationError } from "@afyabridge/authorization";
import { securityErrorResponse } from "../src/lib/security/request-context.ts";

test("authentication failures return generic no-store responses", async () => {
  const response = securityErrorResponse(new AuthenticationError("sensitive detail"));
  const body = await response.json();

  expect(response.status).toBe(401);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(body.error.code).toBe("AUTHENTICATION_REQUIRED");
  expect(body.error.message).toBe("The request was not authorized");
  expect(JSON.stringify(body)).not.toContain("sensitive detail");
});

test("authorization failures do not expose policy reasons", async () => {
  const response = securityErrorResponse(
    new AuthorizationError({ allowed: false, reason: "country_mismatch" })
  );
  const body = await response.json();

  expect(response.status).toBe(403);
  expect(body.error.code).toBe("ACCESS_DENIED");
  expect(JSON.stringify(body)).not.toContain("country_mismatch");
});

test("unexpected failures return stable internal responses", async () => {
  const response = securityErrorResponse(new Error("database credentials leaked"));
  const body = await response.json();

  expect(response.status).toBe(500);
  expect(body.error.code).toBe("INTERNAL_ERROR");
  expect(body.error.message).toBe("The request could not be completed");
  expect(JSON.stringify(body)).not.toContain("database credentials");
});
