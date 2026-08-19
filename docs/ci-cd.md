# CI, supply chain and GitOps

The `CI` workflow validates the application, produces one container artifact,
and hands its immutable digest to the existing GitOps repository. It never
connects to Kubernetes. Argo CD alone synchronizes the manifests, observes the
rollout, and owns deployment and rollback behavior.

## Event behavior

| Event | Validation | Container | GitOps |
| --- | --- | --- | --- |
| Pull request to `main` or `dev` | lint, TypeScript, tests, Next.js build, dependency review, Trivy and CodeQL | built once, scanned, SBOM uploaded; never published | no access |
| Push to `dev` | all blocking checks | `ghcr.io/flotio-dev/app:sha-<full-sha>`, provenance and SPDX SBOM attestations | updates `manifest/dev/app/deploy-app.yaml` |
| Push to `main` | all blocking checks | same immutable convention | waits for the protected `production` environment, then updates `manifest/prod/app/deploy-app.yaml` |
| Tag `vX.Y.Z` | source checks and verification of the existing attestation | adds the `vX.Y.Z` alias to the already-published `sha-<full-sha>` artifact; no rebuild | no access |
| Manual or weekly run | validation and image scan | local only | no access |

The stable required check is `ci-success`. It fails when a mandatory job fails
or is cancelled. There are no workflow-level path filters, so the check is
always created for protected pull requests.

## Image identity and build configuration

The human-readable tag is `sha-<40-character-git-sha>`. GitOps consumes only:

```text
ghcr.io/flotio-dev/app@sha256:<64-hex-character-registry-digest>
```

The GHCR name is normalized to lowercase. The Docker base image and the GitOps
`yq` image are pinned by digest. OCI labels record the source repository,
revision, immutable SHA tag, and commit timestamp. The final Next.js image is
multi-stage and runs as the unprivileged `nextjs` user.

`NEXT_PUBLIC_*` values are public build inputs because Next.js embeds them in
browser bundles. The workflow accepts these optional repository variables and
uses the documented Flotio URLs as defaults:

- `DEV_NEXT_PUBLIC_API_URL`, `DEV_NEXT_PUBLIC_APP_URL`,
  `DEV_NEXT_PUBLIC_WEBSITE_URL`, `DEV_NEXT_PUBLIC_APP_ID`;
- `PROD_NEXT_PUBLIC_API_URL`, `PROD_NEXT_PUBLIC_APP_URL`,
  `PROD_NEXT_PUBLIC_WEBSITE_URL`, `PROD_NEXT_PUBLIC_APP_ID`.

Never put a credential in a `NEXT_PUBLIC_*` variable or Docker build argument.

## Blocking controls

- pnpm frozen-lockfile installation, ESLint, TypeScript and Next.js build;
- existing Vitest contract tests;
- dependency review for pull requests, failing on High/Critical findings;
- Trivy filesystem scan for dependencies, secrets, Dockerfile and IaC;
- CodeQL advanced analysis for JavaScript/TypeScript;
- Trivy scan of the exact locally-built image, failing on High/Critical;
- SPDX JSON SBOM and GitHub-native provenance/SBOM attestations;
- `gh attestation verify` before GitOps and before creating a SemVer alias.

Trivy provides the CI secret scan; GitHub Secret Scanning and Push Protection
must also be enabled in repository settings. No second SAST or secret scanner
is added unless these controls show a measured gap.

## Credentials and permissions

Configure:

- repository variable `GH_APP_CLIENT_ID` containing the GitHub App client ID;
- repository or environment secret `GH_APP_PRIVATE_KEY` containing its private
  key.

Install the GitHub App on owner `flotio-dev`, restricted to repository
`k8s_config`, with only repository **Contents: Read and write**. The workflow
requests a short-lived installation token for that repository and permission,
passes it directly to `actions/checkout`, and lets the action revoke it at job
completion. If the GitOps `main` branch is protected by a ruleset, add this App
to the narrowly scoped bypass list so its direct declarative handoff can push.
Pull-request permission is not needed because production approval uses the
protected `production` environment.

All jobs inherit `contents: read`. Exceptions are deliberately narrow:

| Job | Additional permission |
| --- | --- |
| `codeql` | `security-events: write` |
| `publish` | `packages: write` |
| `attest` | `packages: write`, `id-token: write`, `attestations: write`, `artifact-metadata: write` |
| `release-alias` | `packages: write`, `attestations: read` |

The GitOps write capability comes only from the scoped GitHub App token, not
from `GITHUB_TOKEN`.

## Security exceptions

There are no active exceptions. Add one only to `.trivyignore.yaml` with:

- the exact vulnerability, misconfiguration or secret rule ID;
- `statement` containing both `Owner: @team-or-user` and a concrete
  `Justification:`;
- a finite `expired_at: YYYY-MM-DD` date.

An expired exception is ignored by Trivy and makes the finding blocking again.
Review exceptions in a pull request; do not disable a scanner or use broad
path exclusions.

## Release procedure

1. Merge the release commit to `main` and wait for `ci-success`.
2. Confirm `ghcr.io/flotio-dev/app:sha-<commit-sha>` exists and is attested.
3. Create an explicit signed or annotated tag: `git tag -s vX.Y.Z <commit>`.
4. Push it: `git push origin vX.Y.Z`.

The tag workflow validates strict SemVer, verifies the existing SHA image
attestation, and adds only a registry alias. It does not create a Git tag,
GitHub release, new image, or GitOps change.

## Local verification

Use Node 22 and the package manager declared in `package.json`:

```bash
corepack enable
corepack install
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker build --pull -t app:local .
actionlint .github/workflows/ci.yaml
```

Equivalent Trivy checks, when Trivy is installed:

```bash
trivy fs --scanners vuln,misconfig,secret --severity HIGH,CRITICAL --exit-code 1 .
trivy image --scanners vuln,misconfig,secret --severity HIGH,CRITICAL --exit-code 1 app:local
trivy image --format spdx-json --output sbom.spdx.json app:local
```

## GitHub settings to apply manually

These settings are not versioned by the workflow:

1. Protect `main` and `dev`: require pull requests, `ci-success`, conversation
   resolution, approvals, and up-to-date branches when appropriate; prohibit
   force pushes and deletion.
2. Add a tag ruleset for `v*` that restricts creation, update, and deletion to
   release maintainers.
3. Create the `production` environment with required reviewers, prevent
   self-review, and restrict it to `main`. The `development` environment needs
   no deployment capability or cluster credential.
4. Enable Secret Scanning, Push Protection, Dependabot alerts, Dependabot
   Security Updates, and private vulnerability reporting where available.
5. Keep the versioned CodeQL advanced workflow enabled. Do not also enable
   CodeQL default setup, which would duplicate analysis. Configure code-scanning
   merge protection for relevant High/Critical results where the plan supports
   it.
6. Restrict allowed Actions to GitHub-owned and explicitly approved publishers;
   enforce full-SHA pinning. Dependabot maintains the pinned references.
7. Ensure the repository's `GITHUB_TOKEN` can publish its GHCR package while
   retaining read-only defaults for other jobs.

No Kubernetes credential, kubeconfig, Argo CD token, Helm credential, or
cluster secret belongs in this repository's Actions configuration.
