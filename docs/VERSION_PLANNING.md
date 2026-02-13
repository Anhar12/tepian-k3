# Version Planning

## Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/) (SemVer):

```
MAJOR.MINOR.PATCH
```

| Type      | When                                                                 | Example         |
| --------- | -------------------------------------------------------------------- | --------------- |
| **PATCH** | Bug fixes, typos, small tweaks (no new features)                     | v1.0.4 → v1.0.5 |
| **MINOR** | New features that don't break existing behavior or schema            | v1.0.4 → v1.1.0 |
| **MAJOR** | New domain modules, breaking schema changes, major feature additions | v1.0.4 → v2.0.0 |

## Release History

### v1.x.x - Core Platform

| Version    | Description                                            | Status   |
| ---------- | ------------------------------------------------------ | -------- |
| **v1.0.0** | Initial release - Auth, Users, Roles, Permissions      | Released |
| **v1.0.1** | Bug fixes and UI improvements                          | Released |
| **v1.0.2** | Order system and payment flow                          | Released |
| **v1.0.3** | Document verification and signing                      | Released |
| **v1.0.4** | Docker deployment, Dockerfile improvements, env config | Released |

### Existing Module Changes (MINOR / PATCH)

Changes to existing modules (e.g., Pengujian, Order, Auth) follow MINOR or PATCH versioning depending on scope:

| Change Type                              | SemVer | Example         |
| ---------------------------------------- | ------ | --------------- |
| Bug fix in pengujian status calculation  | PATCH  | v1.0.5          |
| New API endpoint for batch export        | MINOR  | v1.1.0          |
| New UI feature (result table, filters)   | MINOR  | v1.2.0          |
| Multiple related improvements (overhaul) | MINOR  | v1.3.0          |
| Breaking schema change on existing table | MAJOR  | v2.0.0 / v3.0.0 |

**Branching for existing modules:**

```
# Small/isolated changes → branch from beta, merge back to beta
beta
├── feat/pengujian-ui-result-table       → v1.1.0
├── fix/pengujian-status-calculation     → v1.0.5
├── feat/pengujian-api-batch-export      → v1.2.0

# Large overhaul → parent branch with sub-branches
beta
├── feat/pengujian-v2                    → v1.3.0 (or MAJOR if breaking)
│   ├── feat/pengujian-v2-db-schema
│   ├── feat/pengujian-v2-api-routers
│   ├── fix/pengujian-v2-status-bug
│   └── feat/pengujian-v2-ui-results
```

> **Note:** An overhaul of an existing module is only MAJOR if it introduces breaking schema changes or removes/renames existing API procedures. Adding new tables, endpoints, or UI pages to an existing module is MINOR.

## Upcoming Releases

---

### v2.0.0 - Pelatihan (Training) Module

**Status:** Planning
**Target:** TBD
**Branch:** `feat/pelatihan`

#### Why Major Version?

- Introduces an entirely new business domain (LMS/Training)
- 12 new database tables
- 10 new tRPC routers
- Modifies existing order system (`orderItemType` enum extension)
- New permissions model for training management
- New certificate generation pipeline

#### Pre-release Versions

| Version            | Scope                                     | Milestone         |
| ------------------ | ----------------------------------------- | ----------------- |
| **v2.0.0-alpha.1** | Database schema + enums + migrations      | Schema Ready      |
| **v2.0.0-alpha.2** | Query functions + validation schemas      | Data Layer Ready  |
| **v2.0.0-alpha.3** | tRPC routers (CRUD + cart + enrollment)   | API Ready         |
| **v2.0.0-alpha.4** | Certificate generation service            | Services Ready    |
| **v2.0.0-beta.1**  | Frontend: browse, detail, cart, checkout  | UI Core Ready     |
| **v2.0.0-beta.2**  | Frontend: enrollment, materials, progress | Learning UI Ready |
| **v2.0.0-beta.3**  | Frontend: assessments (pre/post test)     | Assessment Ready  |
| **v2.0.0-beta.4**  | Frontend: certificates + admin panel      | Feature Complete  |
| **v2.0.0-rc.1**    | Integration testing, bug fixes, polish    | Release Candidate |
| **v2.0.0**         | Production release                        | GA                |

#### Feature Breakdown

**Alpha Phase (Backend)**

- [ ] Database schema (12 tables, 6 enums)
- [ ] Drizzle migrations
- [ ] Query functions (Effect-based)
- [ ] Zod validation schemas
- [ ] tRPC routers (10 routers)
- [ ] Cart system for paid trainings
- [ ] Free enrollment flow
- [ ] Order system integration (payment → auto-enrollment)
- [ ] Certificate generation service
- [ ] Permission seeding

**Beta Phase (Frontend)**

- [ ] Browse trainings page
- [ ] Training detail page
- [ ] Cart page + checkout flow
- [ ] My trainings dashboard
- [ ] Material viewer (PPT, PDF)
- [ ] Pre-test / post-test interface
- [ ] Progress tracking UI
- [ ] Certificate viewer + download
- [ ] Admin: training CRUD
- [ ] Admin: material management
- [ ] Admin: assessment + question builder
- [ ] Admin: enrollment management

**RC Phase (Quality)**

- [ ] End-to-end flow testing (free + paid)
- [ ] Mobile responsiveness
- [ ] Permission checks on all routes
- [ ] Audit logging for all mutations
- [ ] Error handling and edge cases
- [ ] Performance review (pagination, lazy loading)

## Git Branching Strategy

```
main                                ← Production (tagged releases)
├── beta                            ← Staging / pre-release testing
│
│   # Existing module changes (MINOR/PATCH)
├── feat/pengujian-ui-result-table  ← v1.1.0 (isolated feature)
├── fix/pengujian-status-calc       ← v1.0.5 (isolated fix)
├── feat/pengujian-v2               ← v1.3.0 (large overhaul, parent branch)
│   ├── feat/pengujian-v2-db-schema
│   ├── feat/pengujian-v2-api-routers
│   └── feat/pengujian-v2-ui-results
│
│   # New module (MAJOR)
├── feat/pelatihan                  ← v2.0.0 feature branch
│   ├── feat/pelatihan-schema       ← alpha.1
│   ├── feat/pelatihan-api          ← alpha.2 - alpha.4
│   ├── feat/pelatihan-frontend     ← beta.1 - beta.4
│   └── feat/pelatihan-polish       ← rc.1
│
└── hotfix/xxx                      ← Patches for current production (v1.0.x)
```

### Branch Rules

| Branch               | Merges Into        | When                                    |
| -------------------- | ------------------ | --------------------------------------- |
| `feat/<scope>-*`     | `beta`             | Isolated feature on existing module     |
| `fix/<scope>-*`      | `beta`             | Isolated fix on existing module         |
| `feat/<module>-v*-*` | `feat/<module>-v*` | Sub-feature of existing module overhaul |
| `feat/<module>-v*`   | `beta`             | Existing module overhaul complete       |
| `feat/pelatihan-*`   | `feat/pelatihan`   | Sub-feature of new module               |
| `feat/pelatihan`     | `beta`             | Alpha/Beta milestone complete           |
| `beta`               | `main`             | RC approved, ready for release          |
| `hotfix/*`           | `main` + `beta`    | Critical production fix                 |

## Tagging & Release Workflow

Tags are created locally and pushed to origin:

```bash
# Create tag
git tag v2.0.0-alpha.1

# Push tag to origin
git push origin v2.0.0-alpha.1

# Or push all tags at once
git push origin --tags
```

### Tag Examples

```bash
# Pre-release tags (during development)
git tag v2.0.0-alpha.1 && git push origin v2.0.0-alpha.1
git tag v2.0.0-beta.1  && git push origin v2.0.0-beta.1
git tag v2.0.0-rc.1    && git push origin v2.0.0-rc.1

# Final release tag
git tag v2.0.0 && git push origin v2.0.0

# Hotfix on current production (while v2 is in development)
git tag v1.0.5 && git push origin v1.0.5
```

### Deleting a Tag (if tagged incorrectly)

```bash
# Delete local tag
git tag -d v2.0.0-alpha.1

# Delete remote tag
git push origin --delete v2.0.0-alpha.1
```

## Migration Safety

### Before v2.0.0 Release

Since v2.0.0 adds 12 new tables and modifies the order system:

1. **Backup database** before running migrations
2. **Run migrations on staging first** (beta branch deployed to staging)
3. **Test existing flows** (testing orders, documents) still work after migration
4. **Seed new permissions** for pelatihan module
5. **Assign permissions** to existing roles as needed

### Rollback Plan

If v2.0.0 deployment fails:

```bash
# 1. Revert to v1.0.4
git checkout v1.0.4

# 2. Rollback migrations (new tables only, no data loss on existing tables)
pnpm db:rollback --to=<last-v1-migration>

# 3. Redeploy v1.0.4
docker compose build --no-cache && docker compose up -d
```

### Parallel Development

While v2.0.0 is in development, production hotfixes for v1.0.x should:

1. Branch from `main` (which is at v1.0.4)
2. Fix, test, merge to `main`
3. Tag as v1.0.5, v1.0.6, etc.
4. Cherry-pick or merge `main` back into `feat/pelatihan` to keep it up to date

## Release Checklist Template

Use this checklist for each release:

```markdown
### Release vX.Y.Z Checklist

**Pre-release**

- [ ] All features merged and tested on beta branch
- [ ] Database migrations tested on staging
- [ ] Type check passes (`pnpm check-types`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Manual testing of critical flows
- [ ] Existing features not broken (regression check)
- [ ] Environment variables documented (if new ones added)
- [ ] CLAUDE.md updated (if architecture changed)

**Release**

- [ ] Merge beta → main
- [ ] Create git tag (vX.Y.Z)
- [ ] Build Docker images
- [ ] Run database migrations on production
- [ ] Deploy to production (Coolify)
- [ ] Verify deployment health

**Post-release**

- [ ] Monitor logs for errors
- [ ] Verify critical user flows in production
- [ ] Update version in package.json (if applicable)
- [ ] Communicate release to team/stakeholders
```
