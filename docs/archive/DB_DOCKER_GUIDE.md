# DB Docker Guide

Run Drizzle-kit commands (Studio, migrate, generate, seed, reset, purge) in Docker without installing anything locally.

---

## Prerequisites

- Docker + Docker Compose
- A root `.env` file (copy from `.env.example` if you don't have one)

The only env var strictly required by the DB compose is `POSTGRES_PASSWORD`.  
Everything else has safe defaults (`tepian` / `tepian_k3`).

---

## Quick Start

### 1 — Build the image

```bash
docker compose -f docker-compose.db.yml --profile studio build
```

Any profile works here since all services share the same image.
Only needed once, or after changes to `package.json` / `pnpm-lock.yaml`.

---

### 2 — Drizzle Studio (web UI)

```bash
docker compose -f docker-compose.db.yml --profile studio up -d
```

Open **http://localhost:4983** in your browser.

Stop it:

```bash
docker compose -f docker-compose.db.yml --profile studio down
```

---

### 3 — Run migrations

```bash
docker compose -f docker-compose.db.yml --profile migrate run --rm migrate
```

---

### 4 — Generate migration files from schema changes

Edit `packages/db/src/schema.ts` on the host, then:

```bash
docker compose -f docker-compose.db.yml --profile generate run --rm generate
```

The new `.sql` files are written back to `packages/db/src/migrations/` on your machine via the volume mount.

---

### 5 — Seed the database

```bash
docker compose -f docker-compose.db.yml --profile seed run --rm seed
```

---

### 6 — Reset the database (destructive)

Truncates all rows but keeps tables, enums, and schema intact.

```bash
docker compose -f docker-compose.db.yml --profile reset run --rm reset
```

---

### 7 — Purge the database (nuclear)

Drops the **entire public schema** — all tables, enums, sequences, and the migration journal. Use when you want a completely clean slate.

```bash
docker compose -f docker-compose.db.yml --profile purge run --rm purge
```

After purging you must re-run migrations:

```bash
docker compose -f docker-compose.db.yml --profile migrate run --rm migrate
```

---

## Port Conflicts

The Postgres container defaults to host port **5432**. If you already have Postgres running locally or via another compose file, override it:

```bash
POSTGRES_PORT=5434 docker compose -f docker-compose.db.yml --profile studio up -d
```

Studio port can also be changed:

```bash
STUDIO_PORT=4984 docker compose -f docker-compose.db.yml --profile studio up -d
```

---

## How It Works

| File                    | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `Dockerfile.drizzle`    | Node 22 + pnpm image with all workspace deps installed    |
| `docker-compose.db.yml` | Postgres service + profile-gated drizzle-kit/tsx services |

The `packages/db/src` directory is **mounted as a live volume**, so schema edits on the host are visible inside the container immediately — no image rebuild required.

The internal `POSTGRES_URL` always points to the `postgres` container on the compose network (`postgres:5432`), regardless of what host port you expose.
