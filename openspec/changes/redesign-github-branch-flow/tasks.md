## 1. Workflow policy

- [x] 1.1 Update `.github/workflows/pr-flow.yml` to allow the normal promotion path and only the documented `sync/*` and `hotfix/*` exceptions.
- [x] 1.2 Apply the same source/target policy to the existing `branch-policy` job in `.github/workflows/build.yml`.
- [x] 1.3 Change `.github/workflows/build.yml` to use read-only workflow permissions and grant `contents: write` only to the release job.

## 2. GitHub repository settings

- [x] 2.1 Verify “Automatically delete head branches” is disabled in the repository Pull Requests settings.
- [ ] 2.2 Verify branch protection or rulesets for `main`, `preview`, and `develop` prevent deletion and require the appropriate checks.
- [ ] 2.3 Verify the chosen protection rules allow the intended `sync/*` and `hotfix/*` PR workflow.

## 3. Verification and handoff

- [x] 3.1 Validate the OpenSpec change artifacts.
- [x] 3.2 Run a YAML/workflow syntax or equivalent static check for both modified workflow files.
- [x] 3.3 Review the final diff and confirm unrelated user changes remain untouched.
- [x] 3.4 Document the required merge methods and local conflict-resolution procedure.
