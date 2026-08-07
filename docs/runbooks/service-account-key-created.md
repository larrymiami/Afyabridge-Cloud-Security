# Service-account key created or uploaded

## Trigger

A user-managed service-account key is created or uploaded.

## Immediate response

Treat the event as unauthorized until an approved exception is established. Identify the service account, actor, project, key ID, creation method, source context, and any subsequent use of the key.

## Containment

Disable or delete an unexpected key after preserving the relevant audit evidence. Review the service account's effective permissions and recent authentication activity. Do not create replacement long-lived keys; restore the intended Workload Identity Federation or workload identity path.

## Recovery and closure

Confirm no active user-managed key remains without an approved exception, validate the keyless authentication path, and review adjacent IAM changes for persistence. Follow `security-detection-response.md` for evidence and escalation requirements.
