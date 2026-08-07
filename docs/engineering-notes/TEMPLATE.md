# <Engineering Note Title>

> **Status:** Draft  
> **Series:** AfyaBridge Engineering Notes  
> **Evidence state:** Designed / Implemented / CI-enforced / Live-validated  
> **Last reviewed:** YYYY-MM-DD

## Why this problem matters

Describe the engineering/security problem in plain language before discussing a product or service.

Questions to answer:

- What are we protecting?
- What trust boundary is involved?
- Why is this problem relevant to AfyaBridge?
- What would a reasonable attacker, operator mistake, or system failure look like?

## Threat and failure model

Describe the concrete ways the system could fail.

```text
Actor / failure
      ↓
Trust boundary crossed
      ↓
Unsafe capability obtained
      ↓
Security / reliability impact
```

Where useful, map the problem to an existing AfyaBridge threat or control ID.

## Design decision

Explain the architecture that was chosen.

Include:

- the control objective;
- the trust assumptions;
- where enforcement happens;
- what inherits from a higher-level policy;
- what remains configurable at a lower level; and
- which component is the source of truth.

Prefer a small diagram where it improves understanding.

## Alternatives considered

| Option | Advantage | Drawback | Decision |
|---|---|---|---|
| Option A |  |  |  |
| Option B |  |  |  |
| Chosen design |  |  | Selected |

Avoid claiming an alternative is "insecure" merely because it was not chosen. State the actual trade-off.

## Implementation

Explain the important implementation details without turning the note into a command transcript.

Reference repository paths where useful.

```text
Configuration
     ↓
Policy / identity / network / service
     ↓
Effective behavior
```

Distinguish clearly between:

- repository desired state;
- CI enforcement;
- deployed Google Cloud configuration; and
- observed runtime behavior.

## Prediction before validation

Before testing the control, state what should happen.

Example:

```text
Expected:
An identity from an untrusted GitHub repository must not be able to impersonate the Terraform apply service account.
```

This prevents the validation from being rewritten around whatever result happened to occur.

## Validation

Document the positive test.

Include:

- what was executed;
- what identity performed it;
- what environment was tested;
- expected result;
- observed result; and
- evidence location.

## Negative / failure test

Deliberately test an unsafe, unauthorized, or broken condition.

Include:

```text
Change or attack:

Expected denial/failure:

Observed result:

Control that stopped it:
```

If the negative test unexpectedly succeeds, record it as a finding rather than hiding it.

## Remediation and retest

If testing introduced drift or exposed a weakness:

1. record the finding;
2. restore the intended state;
3. rerun the validation; and
4. retain evidence of both the failure and successful remediation.

## Evidence

| Evidence | What it proves | What it does not prove |
|---|---|---|
| CI run |  |  |
| Terraform plan/apply |  |  |
| `gcloud`/API output |  |  |
| Audit log |  |  |
| Screenshot/diagram |  |  |

## Evidence boundary

State explicitly what has not been tested yet.

Examples:

- repository configuration has not been applied to a live organization;
- a WAF rule is configured in preview but not enforcing;
- a synthetic drift plan proves evaluator behavior but not remote-state drift detection;
- one tested country path does not automatically prove every country path.

## What I would explain in an interview

Be able to answer without opening the repository:

1. Why was this control necessary?
2. Where is it enforced?
3. What identity is trusted?
4. What happens if that identity is compromised?
5. What alternative would you choose in a smaller environment?
6. How did you prove the control worked?
7. What did the negative test teach you?
8. What remains unvalidated?

## Key takeaways

End with three to five precise engineering lessons, not motivational statements.
