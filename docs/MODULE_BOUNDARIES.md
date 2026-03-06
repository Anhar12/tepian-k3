# Module Boundaries

tepian-k3 is structured as a **modular monolith** with five domain modules. This document defines the boundaries between them and explains how they are enforced.

---

## Dependency Direction

```
platform        (no domain imports allowed)
    ^
pengujian       (can import from platform only)
pelatihan       (can import from platform only)
uji-kompetensi  (can import from platform only)
konsultasi      (can import from platform only)
```

Domain modules **cannot import from each other**. All cross-domain data flows through `platform` exports.

---

## Module Ownership

### platform

Shared infrastructure used by all domains.

| Package      | Path                                 |
| ------------ | ------------------------------------ |
| DB schema    | `packages/db/src/schema/platform.ts` |
| Queries      | `packages/queries/src/platform/`     |
| Zod schemas  | `packages/schema/src/platform/`      |
| tRPC routers | `packages/api/src/routers/platform/` |

**Contains:** users, roles, permissions, employees, positions, geography, notifications, audit logs, documents, banners, news.

### pengujian

Lab testing domain: order → testing → worksheet → document.

| Package      | Path                                  |
| ------------ | ------------------------------------- |
| DB schema    | `packages/db/src/schema/pengujian.ts` |
| Queries      | `packages/queries/src/pengujian/`     |
| Zod schemas  | `packages/schema/src/pengujian/`      |
| tRPC routers | `packages/api/src/routers/pengujian/` |

**Contains:** parameters, tools, clusters, chemical materials, cart, order, testing, worksheets, survey, kbli, user companies.

### pelatihan / uji-kompetensi / konsultasi

Empty scaffolds. Follow the same structure as `pengujian` when building them out.

---

## Lint Enforcement

Boundary violations are caught by ESLint. The rules live in [packages/config/eslint/boundaries.js](../packages/config/eslint/boundaries.js) and are applied in two places:

1. **Per-package** — each domain package (`queries`, `schema`, `api`, `db`) imports the boundary rules in its `eslint.config.js`.
2. **Monorepo root** — `eslint.config.js` adapts the same rules with full package paths so `lint-staged` (which runs from root) also enforces them.

### What triggers a lint error

```ts
// packages/queries/src/platform/users.queries.ts

// ERROR: Platform importing from pengujian domain
import { getOrder } from "../pengujian/order.queries";

// OK: Platform importing its own utilities
import { db } from "@tepian-k3/db/client";
```

```ts
// packages/queries/src/pengujian/order.queries.ts

// ERROR: Pengujian importing from a peer domain
import { something } from "../pelatihan/index";

// OK: Pengujian importing from platform
import { getUserById } from "../platform/users.queries";
```

### Error messages

| Violation            | Message                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Platform → domain    | `Platform layer cannot import from domain modules. Cross-domain data must flow through platform exports only.` |
| Domain → peer domain | `Domain modules cannot import from each other. Use platform exports only for cross-domain data.`               |

---

## Adding a New Domain Module

When building `pelatihan`, `uji-kompetensi`, or `konsultasi`:

1. Add DB tables to `packages/db/src/schema/<module>.ts`
2. Add queries to `packages/queries/src/<module>/`
3. Add Zod schemas to `packages/schema/src/<module>/`
4. Add routers to `packages/api/src/routers/<module>/`
5. The boundary rules already cover these paths — no ESLint changes needed.

---

## Rationale

See [../TODO.md](../TODO.md) (Modular Monolith Migration section) for the full background on why this architecture was chosen over microservices.
