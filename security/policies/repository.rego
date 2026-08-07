package afyabridge.ci

import rego.v1

deny contains violation if {
	workflow := input.workflows[_]
	workflow.pull_request_target
	violation := {
		"rule": "workflow-no-pull-request-target",
		"severity": "critical",
		"path": workflow.path,
		"message": "pull_request_target is prohibited because it can combine untrusted pull-request content with privileged repository context",
	}
}

deny contains violation if {
	workflow := input.workflows[_]
	workflow.enforce_immutable_actions
	action := workflow.actions[_]
	not action.local
	not action.pinned
	violation := {
		"rule": "security-workflow-actions-pinned",
		"severity": "high",
		"path": workflow.path,
		"line": action.line,
		"message": sprintf("security workflow action must use a full immutable commit SHA: %s", [action.reference]),
	}
}

deny contains violation if {
	dockerfile := input.dockerfiles[_]
	dockerfile.final_user == ""
	violation := {
		"rule": "container-non-root-user",
		"severity": "high",
		"path": dockerfile.path,
		"message": "final container stage must declare an explicit non-root USER",
	}
}

deny contains violation if {
	dockerfile := input.dockerfiles[_]
	lower(dockerfile.final_user) == "root"
	violation := {
		"rule": "container-non-root-user",
		"severity": "high",
		"path": dockerfile.path,
		"message": "final container stage must not run as root",
	}
}

deny contains violation if {
	dockerfile := input.dockerfiles[_]
	command := dockerfile.runtime_package_manager_commands[_]
	violation := {
		"rule": "container-no-build-package-managers",
		"severity": "high",
		"path": dockerfile.path,
		"line": command.line,
		"message": sprintf("final runtime stage contains package-manager tooling: %s", [command.command]),
	}
}

deny contains violation if {
	dockerfile := input.dockerfiles[_]
	image := dockerfile.latest_base_images[_]
	violation := {
		"rule": "container-no-latest-base",
		"severity": "high",
		"path": dockerfile.path,
		"line": image.line,
		"message": sprintf("container base image must not use latest: %s", [image.image]),
	}
}

deny contains violation if {
	terraform := input.terraform[_]
	assignment := terraform.primitive_role_assignments[_]
	violation := {
		"rule": "terraform-no-primitive-roles",
		"severity": "critical",
		"path": terraform.path,
		"line": assignment.line,
		"message": sprintf("primitive IAM role assignment is prohibited: %s", [assignment.role]),
	}
}

deny contains violation if {
	terraform := input.terraform[_]
	assignment := terraform.public_principal_assignments[_]
	violation := {
		"rule": "terraform-no-public-principals",
		"severity": "critical",
		"path": terraform.path,
		"line": assignment.line,
		"message": sprintf("public IAM principal assignment is prohibited: %s", [assignment.member]),
	}
}

deny contains violation if {
	terraform := input.terraform[_]
	resource := terraform.authoritative_iam_policy_resources[_]
	violation := {
		"rule": "terraform-no-authoritative-iam-policy",
		"severity": "high",
		"path": terraform.path,
		"line": resource.line,
		"message": sprintf("authoritative IAM policy resources are prohibited; use additive IAM resources instead: %s.%s", [resource.resource_type, resource.resource_name]),
	}
}
