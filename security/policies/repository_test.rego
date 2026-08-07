package afyabridge.ci

import rego.v1

test_compliant_repository_has_no_denies if {
	violations := deny with input as {
		"workflows": [{
			"path": ".github/workflows/security-gates.yml",
			"pull_request_target": false,
			"enforce_immutable_actions": true,
			"actions": [{
				"reference": "actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803",
				"line": 10,
				"local": false,
				"pinned": true,
			}],
		}],
		"dockerfiles": [{
			"path": "apps/web/Dockerfile",
			"final_user": "node",
			"runtime_package_manager_commands": [],
			"latest_base_images": [],
		}],
		"terraform": [{
			"path": "infra/terraform/example.tf",
			"primitive_role_assignments": [],
			"public_principal_assignments": [],
			"authoritative_iam_policy_resources": [],
		}],
	}
	count(violations) == 0
}

test_pull_request_target_is_denied if {
	violations := deny with input as {
		"workflows": [{
			"path": ".github/workflows/unsafe.yml",
			"pull_request_target": true,
			"enforce_immutable_actions": false,
			"actions": [],
		}],
		"dockerfiles": [],
		"terraform": [],
	}
	some violation in violations
	violation.rule == "workflow-no-pull-request-target"
}

test_unpinned_security_action_is_denied if {
	violations := deny with input as {
		"workflows": [{
			"path": ".github/workflows/security-gates.yml",
			"pull_request_target": false,
			"enforce_immutable_actions": true,
			"actions": [{
				"reference": "actions/checkout@v6",
				"line": 12,
				"local": false,
				"pinned": false,
			}],
		}],
		"dockerfiles": [],
		"terraform": [],
	}
	some violation in violations
	violation.rule == "security-workflow-actions-pinned"
}

test_root_runtime_user_is_denied if {
	violations := deny with input as {
		"workflows": [],
		"dockerfiles": [{
			"path": "apps/web/Dockerfile",
			"final_user": "root",
			"runtime_package_manager_commands": [],
			"latest_base_images": [],
		}],
		"terraform": [],
	}
	some violation in violations
	violation.rule == "container-non-root-user"
}

test_runtime_package_manager_is_denied if {
	violations := deny with input as {
		"workflows": [],
		"dockerfiles": [{
			"path": "apps/web/Dockerfile",
			"final_user": "node",
			"runtime_package_manager_commands": [{
				"command": "RUN corepack enable",
				"line": 31,
			}],
			"latest_base_images": [],
		}],
		"terraform": [],
	}
	some violation in violations
	violation.rule == "container-no-build-package-managers"
}

test_latest_base_image_is_denied if {
	violations := deny with input as {
		"workflows": [],
		"dockerfiles": [{
			"path": "apps/web/Dockerfile",
			"final_user": "node",
			"runtime_package_manager_commands": [],
			"latest_base_images": [{
				"image": "node:latest",
				"line": 1,
			}],
		}],
		"terraform": [],
	}
	some violation in violations
	violation.rule == "container-no-latest-base"
}

test_primitive_terraform_role_is_denied if {
	violations := deny with input as {
		"workflows": [],
		"dockerfiles": [],
		"terraform": [{
			"path": "infra/terraform/example.tf",
			"primitive_role_assignments": [{
				"role": "roles/owner",
				"line": 10,
			}],
			"public_principal_assignments": [],
			"authoritative_iam_policy_resources": [],
		}],
	}
	some violation in violations
	violation.rule == "terraform-no-primitive-roles"
}

test_public_terraform_principal_is_denied if {
	violations := deny with input as {
		"workflows": [],
		"dockerfiles": [],
		"terraform": [{
			"path": "infra/terraform/example.tf",
			"primitive_role_assignments": [],
			"public_principal_assignments": [{
				"member": "allUsers",
				"line": 20,
			}],
			"authoritative_iam_policy_resources": [],
		}],
	}
	some violation in violations
	violation.rule == "terraform-no-public-principals"
}

test_authoritative_iam_policy_is_denied if {
	violations := deny with input as {
		"workflows": [],
		"dockerfiles": [],
		"terraform": [{
			"path": "infra/terraform/example.tf",
			"primitive_role_assignments": [],
			"public_principal_assignments": [],
			"authoritative_iam_policy_resources": [{
				"resource_type": "google_project_iam_policy",
				"resource_name": "unsafe",
				"line": 30,
			}],
		}],
	}
	some violation in violations
	violation.rule == "terraform-no-authoritative-iam-policy"
}
