import assert from "node:assert/strict";
import test from "node:test";

import { AuthenticationError } from "@afyabridge/auth";
import { AuthorizationError } from "@afyabridge/authorization";
import { securityErrorResponse } from "../src/lib/security/request-context";

test("authentication failures return generic no-store responses", async () => {
  const response = securityErrorResponse(new AuthenticationError("sensitive detail"));
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(body.error.code, "AUTHENTICATION_REQUIRED");
  assert.equal(body.error.message, "The request was not authorized");
  assert.equal(JSON.stringify(body).includes("sensitive detail"), false);
});

test("authorization failures do not expose policy reasons", async () => {
  const response = securityErrorResponse(
    new AuthorizationError({ allowed: false, reason: "country_mismatch" })
  );
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(body.error.code, "ACCESS_DENIED");
  assert.equal(JSON.stringify(body).includes("country_mismatch"), false);
});

test("unexpected failures return stable internal responses", async () => {
  const response = securityErrorResponse(new Error("database credentials leaked"));
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(body.error.code, "INTERNAL_ERROR");
  assert.equal(body.error.message, "The request could not be completed");
  assert.equal(JSON.stringify(body).includes("database credentials"), false);
});
