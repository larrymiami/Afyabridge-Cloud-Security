# Cloud KMS key state or access changed

## Trigger

A Cloud KMS key version state, primary version, destruction state, restoration state, or IAM policy changes.

## Immediate response

Identify the key, key version, actor, affected project and country, dependent resources, and approval context. Determine whether the action can affect data availability or decryptability.

## Containment

Do not disable or destroy additional key material merely because the alert fired. Preserve audit evidence and choose containment only after confirming dependencies and blast radius. Remove unauthorized IAM changes promptly when safe.

## Recovery and closure

Verify intended key state, IAM, dependent service health, and decryptability of protected resources. Follow `security-detection-response.md` for evidence and escalation requirements.
