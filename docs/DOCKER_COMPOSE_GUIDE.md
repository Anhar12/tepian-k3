# Docker Compose Guide

This project provides multiple Docker Compose files for flexible deployment options.

## Compose Files Overview

| File                        | Services        | Purpose                                       |
| --------------------------- | --------------- | --------------------------------------------- |
| `docker-compose.yml`        | All services    | **All-in-one**: Start everything together     |
| `docker-compose.infra.yml`  | postgres, redis | **Infrastructure**: Shared database and cache |
| `docker-compose.server.yml` | migrate, server | **API Server**: Backend application           |
| `docker-compose.web.yml`    | web             | **Frontend**: React SPA with nginx            |

## Quick Start

### Option 1: All-in-One (Easiest)

Start all services together:

```bash
# Start everything
docker compose up -d

# View logs
docker compose logs -f

# Stop everything
docker compose down
```

### Option 2: Separate Services

Start services individually for more control:

```bash
# 1. Start infrastructure (required first)
docker compose -f docker-compose.infra.yml up -d

# 2. Start server
docker compose -f docker-compose.server.yml up -d

# 3. Start web
docker compose -f docker-compose.web.yml up -d

# View logs for specific service
docker compose -f docker-compose.server.yml logs -f

# Stop specific service
docker compose -f docker-compose.web.yml down
```

### Option 3: Combined Services

Start multiple services with one command:

```bash
# Infrastructure + Server
docker compose -f docker-compose.infra.yml -f docker-compose.server.yml up -d

# All services (alternative to docker-compose.yml)
docker compose -f docker-compose.infra.yml -f docker-compose.server.yml -f docker-compose.web.yml up -d
```

## Common Workflows

### Development Workflow

**Backend development only:**

```bash
# Start infrastructure
docker compose -f docker-compose.infra.yml up -d

# Run server locally (not in Docker)
pnpm dev:server

# Or run server in Docker, web locally
docker compose -f docker-compose.infra.yml -f docker-compose.server.yml up -d
pnpm dev:web
```

**Frontend development only:**

```bash
# Start infrastructure + server
docker compose -f docker-compose.infra.yml -f docker-compose.server.yml up -d

# Run web locally with hot reload
pnpm dev:web
```

**Full stack in Docker:**

```bash
docker compose up -d
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker compose -f docker-compose.server.yml build --no-cache
docker compose -f docker-compose.server.yml up -d

# Rebuild web after changing VITE_SERVER_URL
docker compose -f docker-compose.web.yml build --no-cache web
docker compose -f docker-compose.web.yml up -d

# Rebuild everything
docker compose build --no-cache
docker compose up -d
```

### Database Operations

```bash
# Run migrations
docker compose -f docker-compose.infra.yml up -d
docker compose -f docker-compose.server.yml up migrate

# Access PostgreSQL
docker compose -f docker-compose.infra.yml exec postgres psql -U tepian -d tepian_k3

# Backup database
docker compose -f docker-compose.infra.yml exec postgres pg_dump -U tepian tepian_k3 > backup.sql

# Restore database
docker compose -f docker-compose.infra.yml exec -T postgres psql -U tepian tepian_k3 < backup.sql
```

### Logs and Debugging

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose -f docker-compose.server.yml logs -f server
docker compose -f docker-compose.web.yml logs -f web

# View last 100 lines
docker compose logs --tail=100 server

# Follow logs with timestamps
docker compose logs -f -t server
```

### Scaling Services

```bash
# Run multiple server instances (requires load balancer)
docker compose -f docker-compose.server.yml up -d --scale server=3

# Run multiple web instances
docker compose -f docker-compose.web.yml up -d --scale web=2
```

## Network Architecture

All services communicate via the `tepian-network` bridge network:

```
┌─────────────────────────────────────────┐
│           tepian-network                │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ postgres │  │  redis   │            │
│  └────┬─────┘  └────┬─────┘            │
│       │             │                   │
│       └─────┬───────┘                   │
│             │                           │
│        ┌────▼─────┐                     │
│        │  server  │ :3000               │
│        └────┬─────┘                     │
│             │                           │
│        ┌────▼─────┐                     │
│        │   web    │ :80 → :3001 (host) │
│        └──────────┘                     │
│                                         │
└─────────────────────────────────────────┘

Client ──→ localhost:3001 (nginx) ──→ server:3000 (API)
```

### Port Mapping

| Service  | Internal Port | Host Port | Purpose                                  |
| -------- | ------------- | --------- | ---------------------------------------- |
| postgres | 5432          | 5433      | Database (accessible from host)          |
| redis    | 6379          | 6380      | Cache (accessible from host)             |
| server   | 3000          | 3000\*    | API (only when using server compose)     |
| web      | 80            | 3001      | Frontend (nginx proxies /trpc to server) |

\*Note: In `docker-compose.yml`, server is not exposed to host (nginx proxies instead)

## Environment Variables

### Infrastructure (.env)

```env
POSTGRES_USER=tepian
POSTGRES_PASSWORD=tepian_secret
POSTGRES_DB=tepian_k3
POSTGRES_PORT=5433

REDIS_PASSWORD=redis_secret
REDIS_PORT=6380
```

### Server (.env)

```env
# All server environment variables
# See .env.example for full list
```

### Web (Build Args)

```env
# Baked into JS bundle at build time
VITE_SERVER_URL=http://localhost:3001
WEB_PORT=3001
```

## Troubleshooting

### "network tepian-network not found"

When running separate compose files, create the network first:

```bash
docker network create tepian-network
```

Or start with infrastructure:

```bash
docker compose -f docker-compose.infra.yml up -d
```

### CORS Errors

1. Check `VITE_SERVER_URL` in `.env`:

   ```env
   VITE_SERVER_URL=http://localhost:3001  # Must match web port, not server port
   ```

2. Rebuild web after changing:

   ```bash
   docker compose -f docker-compose.web.yml build --no-cache
   docker compose -f docker-compose.web.yml up -d
   ```

3. Verify nginx proxy in `docker/nginx.conf` has `/trpc` location block

### Server Cannot Connect to Database

Check that infrastructure is running:

```bash
docker compose -f docker-compose.infra.yml ps
```

Check database connection from server:

```bash
docker compose -f docker-compose.server.yml exec server sh
nc -zv postgres 5432
```

### Port Already in Use

Stop conflicting services:

```bash
# Check what's using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill the process or change port in .env
WEB_PORT=8080
```

## Production Considerations

### Security

1. **Change default passwords** in `.env`:

   ```env
   POSTGRES_PASSWORD=<strong-random-password>
   REDIS_PASSWORD=<strong-random-password>
   JWT_SECRET=<strong-random-secret>
   ```

2. **Remove exposed ports** for internal services:

   ```yaml
   # Remove these from docker-compose.yml
   ports:
     - "${POSTGRES_PORT:-5433}:5432" # Remove
     - "${REDIS_PORT:-6380}:6379" # Remove
   ```

3. **Use HTTPS** with reverse proxy (Caddy, Traefik, nginx):
   ```yaml
   # Add Caddy for automatic HTTPS
   caddy:
     image: caddy:2-alpine
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./Caddyfile:/etc/caddy/Caddyfile
   ```

### Performance

1. **Persistent volumes** for data:

   ```bash
   # Backup volumes
   docker run --rm -v tepian-k3_postgres_data:/data -v $(pwd):/backup \
     alpine tar czf /backup/postgres-backup.tar.gz /data
   ```

2. **Resource limits**:

   ```yaml
   services:
     server:
       deploy:
         resources:
           limits:
             cpus: "2"
             memory: 2G
           reservations:
             cpus: "1"
             memory: 1G
   ```

3. **Health checks** ensure availability:
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
     interval: 30s
     timeout: 10s
     retries: 3
     start_period: 40s
   ```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to server
        run: |
          # Copy compose files
          scp docker-compose*.yml user@server:/app/

          # Deploy
          ssh user@server << 'EOF'
            cd /app
            docker compose pull
            docker compose up -d
          EOF
```

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

## See Also

- [CLAUDE.md](../CLAUDE.md) - Project architecture and development guide
- [.env.example](../.env.example) - Environment variable template
- [docker/nginx.conf](../docker/nginx.conf) - Nginx reverse proxy configuration
