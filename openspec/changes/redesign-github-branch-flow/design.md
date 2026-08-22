## Context

The repository uses three persistent promotion branches: `develop`, `preview`, and `main`. The current workflows validate only the normal upward path, while GitHub's repository setting can delete any PR head branch after merge. The same validation logic exists in both `pr-flow.yml` and `build.yml`, so both must remain consistent.

The repository is public and the release workflow needs write access to publish GitHub Releases, but PR validation and build jobs do not need repository write access.

## Goals / Non-Goals

**Goals:**

- Preserve merged feature and promotion branches by disabling automatic head-branch deletion in GitHub settings.
- Make the normal path explicit: `feature/* -> develop -> preview -> main`.
- Provide controlled branch names for conflict-resolution synchronization and main hotfixes.
- Preserve ancestry across promotion merges by documenting merge commits for promotion PRs.
- Keep branch validation and permissions least-privileged.

**Non-Goals:**

- Automatically renaming or locking branches after merge.
- Changing application code, release artifacts, or deployment behavior.
- Allowing arbitrary branches to bypass the promotion flow.
- Replacing GitHub branch protection/rulesets; those remain repository settings managed by an administrator.

## Decisions

### 1. Disable automatic head-branch deletion

The repository setting is the correct control because no workflow currently deletes refs. Keeping branches is safer for a promotion pipeline where `develop` and `preview` are PR head branches. Branch protection should be used separately to prevent unwanted pushes or deletion.

### 2. Use explicit synchronization branch prefixes

The validator will allow only these additional directions:

- `sync/develop-to-preview/* -> preview` for resolving a `develop -> preview` conflict when the original head cannot be updated.
- `sync/preview-to-main/* -> main` for resolving a `preview -> main` conflict.
- `sync/main-to-preview/* -> preview` and `sync/preview-to-develop/* -> develop` for controlled back-sync after a hotfix.
- `hotfix/* -> main` for urgent production fixes.

This keeps exceptions auditable and prevents arbitrary reverse merges.

### 3. Keep policy checks in both existing workflows

`build.yml` already has a branch-policy job and may be configured as a required check. Its logic will be updated together with `pr-flow.yml` rather than removing or silently weakening one of the checks.

### 4. Scope write permissions to release publishing

The workflow-level `contents: write` permission in `build.yml` will become `contents: read`. Only the `release` job will request `contents: write`, because that job creates the GitHub Release. This does not control the repository's automatic deletion setting; it limits the impact of future workflow changes.

### 5. Promotion merge strategy

Feature PRs may use squash merge. Promotion PRs should use merge commits so each promoted branch retains the previous branch as an ancestor. This avoids repeatedly comparing equivalent content with unrelated commit histories.

## Risks / Trade-offs

- [Risk] Existing `develop` or `preview` branches may already be deleted. → Disable automatic deletion first, then recreate missing refs only after verifying the intended commit SHA.
- [Risk] A user could misuse a `sync/*` name. → Require reviews and status checks through branch protection; the workflow only permits narrowly defined target/source prefixes.
- [Risk] Promotion merge commits make history less linear. → This is intentional for ancestry clarity; if repository rules require linear history, use a fully consistent rebase policy instead.
- [Risk] Duplicated policy code can drift. → Keep the two blocks structurally identical and verify both workflow files during review.

## Migration Plan

1. Disable GitHub's automatic head-branch deletion setting.
2. Configure branch protection/rulesets for `main`, `preview`, `develop`, and optionally `feature/*`/`sync/*` without allowing deletions.
3. Merge the workflow changes.
4. Recreate any missing persistent branches from verified refs or merge commits.
5. For existing conflicts, resolve locally on the PR head or use the appropriate `sync/*` branch.

Rollback is to revert the workflow commit and restore the previous branch rules. The repository deletion setting should remain disabled during rollback to avoid losing branches.

## Open Questions

- Whether the repository currently has branch protection rules requiring the old `Branch Policy` job name or linear history must be confirmed in GitHub settings.
