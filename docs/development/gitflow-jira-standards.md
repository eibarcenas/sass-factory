# GitFlow, Jira, Commits, and Release Standards

Date: `2026-06-24`

## Status

Status: `TODO`

`catalog-platform` is an application repository. It uses GitFlow because it has deployable environments and production releases.

## Permanent Branches

| Branch | Environment | Purpose |
| --- | --- | --- |
| `develop` | `dev` | Integration branch for accepted product work. |
| `release/YYYY-MM-DD` | `stg` | Staging candidate for release hardening. |
| `production` | source for production tags | Approved production source. Production deploys must be triggered by SemVer tags. |

## Promotion Flow

```text
feature/JIRA-123-short-name
  -> PR into develop
  -> dev validation

release/YYYY-MM-DD
  -> created from develop
  -> staging validation

production
  -> updated from approved release branch
  -> tag vMAJOR.MINOR.PATCH from production
  -> production deploy from tag
```

## Branch Naming

- `feature/JIRA-123-short-name`
- `fix/JIRA-123-short-name`
- `docs/JIRA-123-short-name`
- `chore/JIRA-123-short-name`
- `test/JIRA-123-short-name`
- `release/YYYY-MM-DD`

Use `NO-JIRA` only for tiny repository hygiene.

## Commit Standard

Use Conventional Commits with the Jira key:

```text
type(scope): JIRA-123 concise summary
```

Examples:

```text
feat(catalog): CATALOG-101 add product image gallery
fix(auth): CATALOG-118 block inactive merchant login
docs(release): CATALOG-120 define production tag flow
chore(ci): NO-JIRA update branch protection docs
```

## Test Gates

Every merge request must document:

- Unit tests.
- Integration tests when API/domain behavior changes.
- End-to-end tests for critical buyer/admin flows.
- Typecheck/build result.
- Manual validation for WhatsApp lead flows when affected.

## Branch Protection Policy

Protect these branches where GitHub plan/settings allow it:

- `develop`: require PR before merge and passing checks.
- `production`: require PR before merge, reviewer approval, and no force pushes.
- `main`: protect only if it exists in this repo.

## Production Rule

Production deploys are tag-based:

```text
vMAJOR.MINOR.PATCH
vMAJOR.MINOR.PATCH-prerelease
```

Tags must be created from commits contained in `origin/production`.
