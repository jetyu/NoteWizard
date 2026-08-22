## Why

The repository currently relies on GitHub's automatic head-branch deletion while using `develop`, `preview`, and `main` as long-lived promotion branches. This can remove environment branches after their promotion PRs merge, and the strict one-way PR policy leaves no supported path for synchronizing hotfixes or resolving complex promotion conflicts.

## What Changes

- Disable automatic deletion of merged PR head branches at the repository level.
- Keep `develop`, `preview`, and `main` as persistent promotion branches.
- Allow feature branches to merge only into `develop`.
- Use merge commits for `develop -> preview` and `preview -> main` promotion PRs so branch ancestry remains explicit.
- Add narrowly scoped `sync/*` and `hotfix/*` exceptions for controlled branch synchronization and urgent fixes.
- Keep the branch-policy workflow read-only and limit repository write permission to the release job.
- Document that complex conflicts are resolved locally and pushed to the PR head branch.

## Capabilities

### New Capabilities

- `github-branch-governance`: Persistent promotion branches, controlled PR directions, branch retention, and conflict/hotfix synchronization rules.

### Modified Capabilities

None.

## Impact

- `.github/workflows/pr-flow.yml` and `.github/workflows/build.yml` branch-policy and permission configuration.
- GitHub repository Pull Requests, branch protection, and ruleset settings.
- Existing promotion PRs may need to be recreated or updated after the branch policy changes.
- No application runtime code, package dependencies, or user data are affected.
