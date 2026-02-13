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

| Type        | SemVer Impact | Merges Into      | Use When                               |
| ----------- | ------------- | ---------------- | -------------------------------------- |
| `feat/`     | MINOR / MAJOR | `beta` or parent | New feature or module                  |
| `fix/`      | PATCH         | `beta`           | Non-critical bug fix                   |
| `hotfix/`   | PATCH         | `main` + `beta`  | Critical production fix                |
| `chore/`    | PATCH         | `beta`           | Dependencies, config, CI/CD, tooling   |
| `refactor/` | PATCH         | `beta`           | Code restructuring, no behavior change |
| `docs/`     | None          | `beta`           | Documentation only                     |

## Long-Lived Branches

| Branch | Purpose                       |
| ------ | ----------------------------- |
| `main` | Production (tagged releases)  |
| `beta` | Staging / pre-release testing |

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

### Minor Feature

```
main
├── beta
├── feat/order-export-csv
├── feat/dashboard-analytics
```

### Bug Fix & Hotfix

```
main
├── beta
├── fix/order-total-calculation           ← non-critical, merges into beta
├── hotfix/auth-token-expiry              ← critical, merges into main + beta
```

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
feat/pelatihan-db-schema ──→ feat/pelatihan ──→ beta ──→ main
feat/pelatihan-api-routers ─┘                    ↑
                                                  │
fix/order-total-calculation ──────────────────────┘
                                                  │
hotfix/auth-token-expiry ─────────────────────────┴──→ main
```

| Branch              | Merges Into     | When                           |
| ------------------- | --------------- | ------------------------------ |
| `feat/<module>-*`   | `feat/<module>` | Sub-feature complete           |
| `feat/<module>`     | `beta`          | Alpha/Beta milestone complete  |
| `fix/*`             | `beta`          | Fix verified                   |
| `beta`              | `main`          | RC approved, ready for release |
| `hotfix/*`          | `main` + `beta` | Critical production fix        |
| `chore/*`, `docs/*` | `beta`          | Change verified                |

## Examples

### Good

```
feat/pelatihan                     # parent feature branch
feat/pelatihan-db-schema           # database schema sub-branch
feat/pelatihan-ui-browse           # frontend sub-branch
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
# Major feature parent
git checkout -b feat/pelatihan

# Sub-branch from parent
git checkout feat/pelatihan
git checkout -b feat/pelatihan-db-schema

# Bug fix
git checkout beta
git checkout -b fix/cart-quantity-validation

# Hotfix from production
git checkout main
git checkout -b hotfix/auth-token-expiry

# Maintenance
git checkout beta
git checkout -b chore/upgrade-tanstack-v5
```
