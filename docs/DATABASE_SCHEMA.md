# Database Schema Reference

This document provides guidelines and references for interacting with the database schema in the `tepian-k3` project.

## Architecture

The database is built using PostgreSQL and Drizzle ORM.
The schema is defined in `packages/db/src/schema` and is split into three main domain files:

1. `platform.ts` - Core entities (users, roles, permissions, regions, settings)
2. `pengujian.ts` - Laboratory testing features (parameters, tools, materials, orders, worksheets, testing)
3. `pelatihan.ts` - LMS and training features (courses, modules, enrollments, assessments, certificates)

## Core Database Patterns

When writing queries or interacting with the database, you **MUST** follow these rules:

1. **UUIDv7 Primary Keys**: Every table uses UUIDv7 for its primary key. The ID must be generated using `uuidv7()` when inserting rows manually.

   ```typescript
   import { uuidv7 } from "uuid";
   id: uuidv7();
   ```

2. **Soft Deletes**: Data is never hard-deleted. Every table has a `deletedAt` timestamp column.
   - When "deleting", set `deletedAt` to `new Date()`.
   - When querying active data, ALWAYS append `.where(isNull(table.deletedAt))`.

3. **Audit Trails**: Every mutation (insert, update, delete) must be recorded using the audit system in `packages/queries`. Use `auditQueries.createAudit`.

4. **Effect Pattern**: All queries in `packages/queries` must be wrapped in `Effect.tryPromise`. Do not use standard async/await `try/catch` blocks inside the query layer.

5. **Schema Changes**:
   - If you modify `packages/db/src/schema/*.ts`, you MUST run `pnpm db:generate`.
   - Never use `pnpm db:push` in production or to build schema changes that you intend to commit. Always generate a migration file.

## Finding Tables (For AI Agents)

To find the exact table definition and its columns, you should inspect the schema files directly:

- **Platform Tables**: View `packages/db/src/schema/platform.ts`
- **Pengujian Tables**: View `packages/db/src/schema/pengujian.ts`
- **Pelatihan Tables**: View `packages/db/src/schema/pelatihan.ts`

These files export the Drizzle `pgTable` definitions (e.g., `users`, `roles`, `testingOrders`) along with their Zod schemas for validation and relations (`relations()` blocks).

## Key Schema Additions & Migrations

- **`user_companies` (Tabel Perusahaan Pemohon)**:
  - `head_of_company`: `varchar(250)` — Nama Pimpinan Perusahaan.
  - `head_of_company_position`: `varchar(250)` — Jabatan Pimpinan Perusahaan.
  - `head_of_company_email`: `varchar(250)` — Email aktif pimpinan perusahaan (Tujuan utama pengiriman tautan TTE persetujuan penawaran dan Perjanjian Kerja Sama). Added in migration `0040_true_vision.sql`.

## Relations

Drizzle relations are heavily used. When fetching data that requires joins, prefer using Drizzle's relational query API (`db.query.tableName.findMany({ with: { relatedTable: true } })`) over manual `.leftJoin()` unless you need complex filtering or aggregation that the relational API cannot handle efficiently.
