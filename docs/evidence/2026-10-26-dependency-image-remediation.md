# Dependency and image remediation — 2026-10-26

## Scope

This change follows the baseline review in PR #83 and is based on its branch. It does not merge dependency bot PRs, migrate Terraform providers, change security severities or exceptions, or deploy cloud resources.

The fresh registry audit of the baseline reported 7 critical, 8 high, 11 moderate, and 2 low advisory entries. Its current findings supersede the versions in older dependency PR #57: Next.js requires at least 16.4.1, Zod 4.6.6, sharp 0.35.5, and the test toolchain also requires remediation.

## Changes

- Update Next.js to 16.4.3 and React / React DOM to 19.3.1, keeping their supported major lines.
- Update every Zod consumer to 4.6.7. Refresh the dependency lock graph, including sharp 0.35.5, nanoid 3.3.20, and source-map-js 1.2.2.
- Migrate all four Vitest consumers from 3.2.7 to 4.1.12. The old toolchain includes vulnerable mocker and tinypool dependencies; the new toolchain removes tinypool. Declare a patched Vite 7 peer explicitly in each test workspace rather than retaining the vulnerable auto-installed 7.3.6 peer.
- Update both build and runtime stages to Node 22.23.4 on Alpine 3.24, preserving digest pins, the Node 22 execution family, non-root runtime, standalone output, and runtime package-manager removal. Align application CI to 22.23.4. No mutable `apk upgrade` step is introduced.

## Image provenance and scan boundary

Docker Hub's official `library/node` tag metadata, retrieved on 2026-10-26, identifies `22.23.4-alpine3.24` with multi-platform digest `sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914` (published 2026-10-22). Both stages use that immutable reference.

The baseline image scan in Security gates run [40281047053](https://github.com/larrymiami/Afyabridge-Cloud-Security/actions/runs/40281047053), job 121434193252, reported libcrypto3 and libssl3 3.5.7-r0 with scanner-reported fixed version 3.5.8-r0, plus nine high/critical application-package findings. A new base digest alone is not evidence of a clean built image: the remediation PR must pass the existing container scan.

## Verification

- Workspace lint and typecheck passed after the application and Vitest updates.
- All 21 non-database application tests passed with Vitest 4.1.12.
- Production workspace build passed using the documented development configuration and synthetic local database URL; no live database access is required for this build.
- Supply-chain identity and governance validators passed; all 20 compromise scenarios passed. Digest pins and fail-closed severity gates remain enforced.
- Full PostgreSQL integration, frozen-install verification on Node 22.23.4, and built-image scanning require fresh PR CI. Local tooling uses Node 22.23.1 / pnpm 10.14.0; Docker and PostgreSQL are unavailable locally.

The final frozen installation passed. The fresh registry audit of the complete workspace graph reports zero advisories at every severity after explicitly resolving Vite 7.3.7. The scanner metadata classifies all 161 dependencies together; this result is not limited to production dependencies. Built-image and CI outcomes remain pending; the registry audit alone is not a deployment-ready verdict.
