# Branch Naming Convention

This document defines the Git branch naming convention for the tepian-k3 monorepo. It aligns with our [Semantic Versioning strategy](VERSION_PLANNING.md) and monorepo package structure.

## Branch Name Format

```
<type>/<scope>[-<description>]
```

| Segment       | Required | Description              | Example                          |
| ------------- | -------- | ------------------------ | -------------------------------- |
| `type`        | Yes      | Branch category          | `feat`, `fix`, `hotfix`, `chore` |
| `scope`       | Yes      | Module or area           | `pelatihan`, `auth`, `order`     |
| `description` | Optional | Specific task kebab-case | `db-schema`, `ui-browse`         |

## Branch Types

| Type        | SemVer Impact | Checkout From | Merges Into      | Use When                                          |
| ----------- | ------------- | ------------- | ---------------- | ------------------------------------------------- |
| `feat/`     | MINOR / MAJOR | `beta`        | `beta` or parent | New feature or module                             |
| `fix/`      | PATCH         | `beta`        | `beta`           | Non-critical bug fix (ships with next beta cycle) |
| `hotfix/`   | PATCH         | **`main`**    | `main` + `beta`  | Any isolated change that needs its own release    |
| `chore/`    | PATCH         | `beta`        | `beta`           | Dependencies, config, CI/CD, tooling              |
| `refactor/` | PATCH         | `beta`        | `beta`           | Code restructuring, no behavior change            |
| `docs/`     | None          | `beta`        | `beta`           | Documentation only                                |

> **Golden rule:** If you need to release a change **independently** of everything currently in `beta`, use `hotfix/` branched from `main` — not `chore/` or `fix/`. Otherwise you will drag all unreleased `beta` commits into `main`.

## Long-Lived Branches

| Branch | Purpose                       |
| ------ | ----------------------------- |
| `main` | Production (tagged releases)  |
| `beta` | Staging / pre-release testing |

> **Keep `beta` in sync with `main`** — after every merge to `main` (hotfix or release), immediately run:
>
> ```bash
> git checkout beta && git merge main && git push origin beta
> ```

## Layer Prefixes

For sub-branches of a large feature, use a layer prefix to indicate which package(s) are affected:

| Prefix | Package(s)                                              | Example                          |
| ------ | ------------------------------------------------------- | -------------------------------- |
| `db-`  | `packages/db` (schema, migrations)                      | `feat/pelatihan-db-schema`       |
| `api-` | `packages/api` + `packages/queries` + `packages/schema` | `feat/pelatihan-api-routers`     |
| `svc-` | `packages/services`                                     | `feat/pelatihan-svc-certificate` |
| `ui-`  | `apps/web`                                              | `feat/pelatihan-ui-browse`       |

## Naming Rules

1. **Always use kebab-case** — `feat/pelatihan-ui-browse` not `feat/pelatihan_ui_browse`
2. **Keep it short** — Aim for under 50 characters total
3. **No version numbers in branch names** — Versions belong in tags (`v2.0.0-alpha.1`), not branches
4. **Use common abbreviations** — `svc`, `ui`, `db`, `auth`, `config`
5. **Optional issue ID** — Prefix the scope with the GitHub Issue number if applicable: `feat/123-pelatihan-ui-browse`

## Branching Structure

### Major Feature (v2.0.0 - Pelatihan)

```
main
├── beta
├── feat/pelatihan                        ← parent feature branch
│   ├── feat/pelatihan-db-schema          ← alpha.1
│   ├── feat/pelatihan-api-queries        ← alpha.2
│   ├── feat/pelatihan-api-routers        ← alpha.3
│   ├── feat/pelatihan-svc-certificate    ← alpha.4
│   ├── feat/pelatihan-ui-browse          ← beta.1
│   ├── feat/pelatihan-ui-enrollment      ← beta.2
│   ├── feat/pelatihan-ui-assessment      ← beta.3
│   ├── feat/pelatihan-ui-admin           ← beta.4
│   └── feat/pelatihan-polish             ← rc.1
```

### Existing Module Changes (e.g., Pengujian)

For modules that already exist, branch strategy depends on the scope of work:

**Small/isolated changes** — branch directly from `beta`:

```
main
├── beta
├── feat/pengujian-ui-result-table       ← single new feature
├── fix/pengujian-status-calculation     ← single bug fix
├── feat/pengujian-api-batch-export      ← single API addition
```

**Large batch of related changes** — use a parent branch:

```
main
├── beta
├── feat/pengujian-v2                        ← parent feature branch
│   ├── feat/pengujian-v2-db-schema          ← schema changes
│   ├── feat/pengujian-v2-api-routers        ← new/updated API endpoints
│   ├── fix/pengujian-v2-status-bug          ← fix discovered during work
│   ├── feat/pengujian-v2-ui-results         ← new UI feature
│   └── feat/pengujian-v2-ui-admin           ← admin panel updates
```

### Minor Feature

```
main
├── beta
├── feat/order-export-csv
├── feat/dashboard-analytics
```

### Bug Fix & Hotfix

```
main (v1.11.0)
├── beta                                  ← has unreleased feat/pengujian-v2 etc.
├── fix/order-total-calculation           ← non-critical, branches from beta, ships with next beta release
└── hotfix/auth-token-expiry              ← branches from main, ships immediately as v1.11.1
```

> **Why does this matter?** If you branch `fix/` or `chore/` from `beta` and merge it into `main` directly, every unreleased commit on `beta` (e.g. `feat/pengujian-v2`) gets pulled into the release too.

### Maintenance

```
main
├── beta
├── chore/upgrade-tanstack-v5
├── refactor/document-service
├── docs/api-rate-limiting
```

## Merge Flow

```
feat/pelatihan-db-schema ──→ feat/pelatihan ──→ beta ──→ main (release)
feat/pelatihan-api-routers ─┘                    ↑            │
                                                  │            ↓
fix/order-total-calculation ──────────────────────┘     sync beta ← main
                                                               ↑
hotfix/auth-token-expiry (from main) ──────────────────→ main (patch release)
                                     └─────────────────→ beta (sync)
```

| Branch              | Merges Into     | When                                 |
| ------------------- | --------------- | ------------------------------------ |
| `feat/<module>-*`   | `feat/<module>` | Sub-feature complete (parent branch) |
| `feat/<module>`     | `beta`          | Alpha/Beta milestone complete        |
| `feat/<scope>-*`    | `beta`          | Isolated feature on existing module  |
| `fix/<scope>-*`     | `beta`          | Fix on existing module verified      |
| `fix/*`             | `beta`          | Fix verified                         |
| `beta`              | `main`          | RC approved, ready for release       |
| `hotfix/*`          | `main` + `beta` | Critical production fix              |
| `chore/*`, `docs/*` | `beta`          | Change verified                      |

## Examples

### Good

```
feat/pelatihan                     # parent feature branch (new module)
feat/pelatihan-db-schema           # database schema sub-branch
feat/pelatihan-ui-browse           # frontend sub-branch
feat/pengujian-ui-result-table     # new feature on existing module
feat/pengujian-api-batch-export    # new API on existing module
fix/pengujian-status-calculation   # bug fix on existing module
feat/pengujian-v2                  # parent branch for large existing module overhaul
feat/pengujian-v2-db-schema        # sub-branch of existing module overhaul
feat/order-bulk-download           # minor feature
fix/cart-quantity-validation        # bug fix
hotfix/jwt-secret-rotation         # critical production fix
chore/upgrade-drizzle-0.35         # dependency update
refactor/storage-service           # code cleanup
docs/employee-auth-guide           # documentation
feat/42-pelatihan-ui-browse        # with GitHub Issue #42
```

### Bad

```
feature/pelatihan_schema           # wrong type prefix, underscore
feat/pelatihan/schema              # nested slashes
feat/v2.0.0-pelatihan-schema       # version in branch name
pelatihan-schema                   # missing type prefix
feat/Add-Pelatihan-UI-Browse-Page  # PascalCase, too verbose
fix/bug                            # too vague
temp/test-stuff                    # non-standard type
```

## Quick Reference

```bash
# Major feature parent (new module)
git checkout -b feat/pelatihan

# Sub-branch from parent
git checkout feat/pelatihan
git checkout -b feat/pelatihan-db-schema

# Existing module — isolated feature
git checkout beta
git checkout -b feat/pengujian-ui-result-table

# Existing module — isolated fix
git checkout beta
git checkout -b fix/pengujian-status-calculation

# Existing module — large overhaul parent
git checkout beta
git checkout -b feat/pengujian-v2

# Existing module — overhaul sub-branch
git checkout feat/pengujian-v2
git checkout -b feat/pengujian-v2-api-routers

# Bug fix
git checkout beta
git checkout -b fix/cart-quantity-validation

# Hotfix / isolated patch release (MUST branch from main, not beta)
git checkout main
git pull origin main
git checkout -b hotfix/auth-token-expiry
# ... fix ...
git checkout main && git merge hotfix/auth-token-expiry
git tag v1.x.y
git checkout beta && git merge main && git push origin beta  # keep beta in sync

# Maintenance (ships with next beta release, safe to branch from beta)
git checkout beta
git checkout -b chore/upgrade-tanstack-v5
```
