# Public IAM access granted

## Trigger

An IAM policy change grants a role to `allUsers` or `allAuthenticatedUsers`.

## Immediate response

Identify the affected resource, granted role, actor, and approval context. Determine whether the public binding is reachable from the internet and whether sensitive or country-scoped data is exposed.

## Containment

Remove unauthorized public bindings immediately when doing so will not destroy evidence. Restore the reviewed authenticated access path and check for equivalent public exposure through adjacent resources or ingress configuration.

## Recovery and closure

Verify anonymous access is denied, intended authenticated access still works, and no data exposure occurred during the window. Follow `security-detection-response.md` for escalation and evidence requirements.
