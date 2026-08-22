## ADDED Requirements

### Requirement: Persistent promotion branches

The repository SHALL retain merged pull-request head branches, including `feature/*`, `develop`, and `preview`, unless an administrator or an explicitly authorized maintainer deletes them manually.

#### Scenario: Promotion branch remains after merge

- **WHEN** a pull request from `develop` is merged into `preview`
- **THEN** the `develop` branch remains available on the remote repository

#### Scenario: Feature branch remains after merge

- **WHEN** a pull request from `feature/*` is merged into `develop`
- **THEN** the feature branch remains available for audit and recovery

### Requirement: Controlled pull-request directions

The PR validation workflows SHALL accept the normal promotion path `feature/* -> develop`, `develop -> preview`, and `preview -> main`, plus only the explicitly named synchronization and hotfix prefixes.

#### Scenario: Normal feature promotion

- **WHEN** a PR source matches `feature/*` and its target is `develop`
- **THEN** the PR flow check passes

#### Scenario: Normal environment promotion

- **WHEN** a PR is `develop -> preview` or `preview -> main`
- **THEN** the PR flow check passes

#### Scenario: Conflict synchronization

- **WHEN** a PR source matches `sync/develop-to-preview/*`, `sync/preview-to-main/*`, `sync/main-to-preview/*`, or `sync/preview-to-develop/*` and targets its corresponding branch
- **THEN** the PR flow check passes

#### Scenario: Production hotfix

- **WHEN** a PR source matches `hotfix/*` and its target is `main`
- **THEN** the PR flow check passes

#### Scenario: Unsupported direction

- **WHEN** a PR does not match an allowed source/target pair
- **THEN** the PR flow check fails with the expected direction and actual direction

### Requirement: Least-privilege workflow permissions

The validation and build jobs SHALL use read-only repository permissions, and only the release-publishing job SHALL request `contents: write`.

#### Scenario: PR validation token

- **WHEN** a PR validation workflow runs
- **THEN** its repository contents permission is read-only

#### Scenario: Release publishing token

- **WHEN** the release job publishes a GitHub Release
- **THEN** that job has `contents: write` permission
