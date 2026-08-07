# Primitive IAM role granted

## Trigger

An IAM policy change contains `roles/owner` or `roles/editor`.

## Immediate response

Identify the affected resource, principal, actor, approval record, and complete policy delta. Determine whether the role is newly granted or part of a broader policy replacement.

## Containment

Remove an unauthorized primitive-role binding and replace it with the narrow reviewed role set. Verify inherited access and nearby IAM changes before closure.

## Recovery and closure

Confirm the intended least-privilege binding is effective and no equivalent broad access remains through another group, folder, or project binding. Follow `security-detection-response.md` for evidence requirements.
