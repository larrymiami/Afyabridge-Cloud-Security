# Edge security negative-test matrix

## Purpose

This matrix defines the minimum negative tests required before v0.7G edge controls can be described as runtime validated. The current repository state is static-only; the tests below have not yet been executed against a live Google Cloud deployment.

| Control | Negative test | Expected result | Evidence |
|---|---|---|---|
| Direct Cloud Run access | Request the default Cloud Run service URL from the public internet | Request cannot bypass the load balancer into the protected service | Request/response, Cloud Run ingress configuration, logs |
| Country routing | Send Kenya hostname traffic while attempting to target Ghana or South Africa backend identifiers | Request remains bound to Kenya edge/backend; no cross-country route succeeds | DNS, URL-map/backend inventory, request logs |
| DNS ownership | Configure an application hostname outside its declared country managed zone | Terraform validation rejects the configuration | CI output |
| HTTPS-only ingress | Request `http://<hostname>/path` | Permanent redirect to the equivalent HTTPS URL; backend is not served over cleartext | Response headers/status and LB logs |
| TLS floor | Attempt TLS 1.0 and TLS 1.1 negotiation | Handshake fails | TLS client transcript |
| Certificate hostname | Connect using an unapproved hostname/SNI value | Valid certificate is not presented for the unapproved name | TLS transcript |
| Certificate authorization | Remove or corrupt the DNS authorization record in a controlled non-production test | Certificate provisioning/renewal readiness becomes unhealthy and monitoring/runbook captures the condition | DNS output and certificate state |
| WAF SQLi | Send a controlled SQL-injection signature to a non-sensitive test endpoint | Preview mode records the match; enforcement mode denies only after approval | Cloud Armor logs and response |
| WAF XSS | Send a controlled XSS signature | Preview match, then reviewed enforcement denial | Cloud Armor logs and response |
| WAF file/RCE patterns | Send controlled LFI/RFI/RCE signatures | Preview match, then reviewed enforcement denial | Cloud Armor logs and response |
| WAF false-positive control | Replay representative legitimate requests during preview | Legitimate traffic is not unintentionally denied when enforcement is enabled | Baseline traffic results and policy logs |
| Rate limiting | Exceed the configured per-IP threshold from a controlled source | Preview logs threshold behavior; enforcement throttles after approved promotion | Cloud Armor logs and response codes |
| Rate-limit separation | Generate normal traffic from a second source while the first source exceeds its threshold | Second source remains unaffected under IP-keyed throttling | Request logs |
| Default Cloud Armor path | Send benign request that matches no higher-priority rule | Request reaches intended backend | Cloud Armor/backend logs |
| Proxy subnet isolation | Attempt to reuse or overlap a country proxy-only CIDR in configuration | Terraform validation rejects duplicate country proxy CIDRs; live network review confirms no overlap | CI output and deployed subnet inventory |
| Public IP separation | Resolve all three country hostnames | Each hostname resolves to its own reviewed country edge address | DNS output |
| Backend logging | Send a known request through the edge | Corresponding backend/load-balancer log is present | Cloud Logging entry |
| Rollback | Introduce a controlled preview/enforcement misconfiguration and restore prior configuration | Service and security posture return to the recorded baseline without making Cloud Run public | Plan/apply history and test results |

## Test-data constraints

Use synthetic data and dedicated test requests. Do not place real health records, credentials, secrets, or production personal data into WAF payloads or evidence artifacts.

## Promotion gate

Cloud Armor rules should remain in preview until the relevant positive/negative tests have been executed with representative traffic, false positives reviewed, exceptions documented, and the enforcing country approved independently.
