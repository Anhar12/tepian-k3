# Panduan Deployment dengan Docker

Aplikasi tepian-k3 yang berbasis monorepo (Turborepo) dapat di-deploy dengan mudah menggunakan Docker. Berikut adalah panduan dasar untuk membangun dan menjalankan container.

## 1. Persiapan Dockerfile

Buat sebuah `Dockerfile` di root direktori proyek. Karena menggunakan Turborepo, sangat disarankan untuk menggunakan fitur `turbo prune` agar Docker image yang dihasilkan kecil dan efisien.

```dockerfile
# Contoh Dockerfile (Tahap Dasar)
FROM node:18-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Tahap Prune
FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
# Ganti dengan nama app yang ingin di-build (misalnya @tepian-k3/server)
RUN turbo prune --scope=@tepian-k3/server --docker

# Tahap Build
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@tepian-k3/server

# Tahap Produksi
FROM base AS runner
WORKDIR /app
COPY --from=builder /app .
CMD ["node", "apps/server/dist/index.js"]
```

## 2. Menggunakan Docker Compose

Untuk menjalankan seluruh stack (Database, Server API, dan Frontend), gunakan `docker-compose.yml`.

```yaml
version: "3.8"
services:
  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: tepian_k3
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  server:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:password@db:5432/tepian_k3
      PORT: 3000
    depends_on:
      - db

volumes:
  pgdata:
```

## 3. Perintah Deployment

1. **Build dan jalankan di background**:
   ```bash
   docker-compose up -d --build
   ```
2. **Lihat log server**:
   ```bash
   docker-compose logs -f server
   ```
3. **Menghentikan layanan**:
   ```bash
   docker-compose down
   ```
