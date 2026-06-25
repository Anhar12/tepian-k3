# tepian-k3

A modern, type-safe TypeScript monorepo built with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack). Powered by **Turborepo** for blazing-fast builds and **pnpm workspaces** for efficient dependency management.

## 📖 Panduan Penting (Developer & AI Agent Guides)

Sebelum memulai pengerjaan kode, mohon membaca panduan berikut untuk memahami alur kerja, konvensi, dan menghindari error umum:

- [Developer & AI Agent Playbook](docs/DEVELOPER_AND_AGENT_PLAYBOOK.md) — Panduan lengkap alur data, debugging, coding patterns (Effect Library), dan Common Pitfalls.
- [AGENTS.md](AGENTS.md) — Panduan aturan proyek berbahasa Indonesia untuk AI agents.
- [CLAUDE.md](CLAUDE.md) — English project configuration & guidelines for AI agents.
- [Frontend Design Guide](docs/FRONTEND_DESIGN_GUIDE.md) — Desain sistem UI/UX, tokens, dan layout.
- [Permissions & Role Guide](docs/PERMISSIONS_GUIDE.md) — Dokumentasi 363 permissions granular sistem.

## ✨ Features

- 🔒 **End-to-end type safety** - From database to UI with tRPC
- ⚡ **Lightning-fast builds** - Turborepo caching and parallel execution
- 📦 **Monorepo architecture** - Shared packages with `@tepian-k3/*` namespace
- 🎯 **File-based routing** - TanStack Router with full TypeScript support
- 🗄️ **Type-safe ORM** - Drizzle with PostgreSQL
- 📱 **PWA ready** - Progressive Web App with offline support
- 🎨 **Modern UI** - shadcn/ui + TailwindCSS
- 🔧 **DX optimized** - Git hooks, ESLint, Prettier, hot reload

## 🛠️ Tech Stack

| Layer            | Technologies                                        |
| ---------------- | --------------------------------------------------- |
| **Frontend**     | React, TanStack Router, TailwindCSS, shadcn/ui, PWA |
| **Backend**      | Hono, tRPC, Node.js, Effect                         |
| **Database**     | PostgreSQL, Drizzle ORM                             |
| **Monorepo**     | Turborepo, pnpm workspaces                          |
| **Type Safety**  | TypeScript 5+, Zod                                  |
| **Code Quality** | ESLint, Prettier, Husky                             |

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher
- **pnpm** 8.x or higher
- **PostgreSQL** 14+ database instance

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/rizrmdhn/tepian-k3.git
cd tepian-k3

# Install dependencies
pnpm install
```

### 2. Environment Setup

Create a `.env` file at the root of the monorepo:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tepian_k3

# Server
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this

# Email Service (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Storage
STORAGE_PATH=./uploads
```

### 3. Database Setup

```bash
# Push schema to database (development)
pnpm db:push

# Or run migrations (production)
pnpm db:migrate

# (Optional) Seed with initial data
pnpm db:seed
```

### 4. Start Development

```bash
# Start all apps with Turborepo
pnpm dev
```

Access your applications:

- 🌐 **Web App**: http://localhost:3001
- 🔌 **API Server**: http://localhost:3000
- 📊 **Database Studio**: Run `pnpm db:studio`

## 📁 Monorepo Structure

```
tepian-k3/
├── apps/
│   ├── web/                      # React + TanStack Router frontend
│   │   ├── src/
│   │   │   ├── routes/          # File-based routes (auto-generated types)
│   │   │   ├── components/      # React components
│   │   │   ├── lib/             # tRPC client, utils
│   │   │   └── main.tsx         # App entry point
│   │   ├── public/              # Static assets
│   │   └── package.json
│   └── server/                   # Hono backend server
│       ├── src/
│       │   ├── index.ts         # Server entry + tRPC handler
│       │   └── middlewares/     # Auth, CORS, logging
│       ├── logs/                # Application logs
│       └── uploads/             # User file uploads
│
├── packages/
│   ├── api/                      # tRPC API definition
│   │   └── src/
│   │       ├── root.ts          # Root router
│   │       └── routers/         # Feature routers (users, posts, etc.)
│   ├── auth/                     # Authentication logic
│   │   └── src/
│   │       ├── middleware.ts    # Auth middleware
│   │       └── utils.ts         # JWT helpers
│   ├── db/                       # Database layer
│   │   ├── src/
│   │   │   ├── schema.ts        # Drizzle schema definitions
│   │   │   ├── client.ts        # Database client
│   │   │   └── migrations/      # SQL migrations
│   │   └── drizzle.config.ts
│   ├── queries/                  # Reusable database queries
│   ├── schema/                   # Zod validation schemas
│   ├── services/                 # External services (email, storage, logger)
│   ├── types/                    # Shared TypeScript types
│   ├── utils/                    # Shared utility functions
│   ├── constants/                # App-wide constants
│   ├── config/                   # Shared configs (tsconfig.base.json)
│   └── shared/                   # Cross-app utilities
│
├── turbo.json                    # Turborepo pipeline configuration
├── pnpm-workspace.yaml           # pnpm workspace definition
├── package.json                  # Root scripts and dev dependencies
└── .env                          # Environment variables (not committed)
```

## 📦 Workspace Packages

All packages use the `@tepian-k3/*` namespace and are managed via pnpm workspaces:

| Package                | Purpose                   | Used By                            |
| ---------------------- | ------------------------- | ---------------------------------- |
| `@tepian-k3/api`       | tRPC routers & procedures | `apps/web`, `apps/server`          |
| `@tepian-k3/db`        | Database schema & client  | `packages/queries`, `packages/api` |
| `@tepian-k3/auth`      | Authentication logic      | `apps/server`, `packages/api`      |
| `@tepian-k3/schema`    | Zod validation schemas    | All packages                       |
| `@tepian-k3/queries`   | Database query functions  | `packages/api`                     |
| `@tepian-k3/services`  | Email, storage, logging   | `apps/server`, `packages/api`      |
| `@tepian-k3/types`     | Shared TypeScript types   | All packages                       |
| `@tepian-k3/utils`     | Utility functions         | All packages                       |
| `@tepian-k3/constants` | App constants             | All packages                       |

### Import Example

```typescript
import { userRouter } from "@tepian-k3/api/routers/users";
import { db } from "@tepian-k3/db";
import { userSchema } from "@tepian-k3/schema";
```

## 🔧 Available Scripts

All scripts leverage **Turborepo** for optimized execution with intelligent caching.

### Development

```bash
pnpm dev              # Start all apps in development mode
pnpm dev:web          # Start only the web app
pnpm dev:server       # Start only the API server
```

### Building

```bash
pnpm build            # Build all apps and packages
pnpm build:web        # Build only the web app
pnpm build:server     # Build only the server
```

### Type Checking & Linting

```bash
pnpm check-types      # Type check entire monorepo
pnpm lint             # Lint all packages
pnpm format           # Format code with Prettier
```

### Database

```bash
pnpm db:push          # Push schema changes (dev only)
pnpm db:migrate       # Run migrations (production)
pnpm db:studio        # Open Drizzle Studio GUI
pnpm db:seed          # Seed database with initial data
pnpm db:reset         # Reset database and re-run migrations
```

### PWA

```bash
cd apps/web && pnpm generate-pwa-assets  # Generate PWA icons/splashes
```

### Workspace Management

```bash
pnpm install                                    # Install all dependencies
pnpm add <package> -w                           # Add to root workspace
pnpm add <package> --filter @tepian-k3/web      # Add to specific package
pnpm add @tepian-k3/utils --filter apps/web     # Add internal dependency
```

## ⚡ Turborepo Optimization

This monorepo uses Turborepo for:

✅ **Parallel Execution** - Run tasks across packages simultaneously  
✅ **Smart Caching** - Never rebuild the same code twice  
✅ **Dependency Graph** - Build packages in the correct order  
✅ **Incremental Builds** - Only rebuild what changed  
✅ **Remote Caching** - Share cache with your team (optional)

### Cache Management

```bash
# Force rebuild (ignore cache)
pnpm turbo run build --force

# View what would be cached
pnpm turbo run build --dry-run

# Clear local cache
rm -rf .turbo
```

### Pipeline Configuration

The [`turbo.json`](turbo.json) defines task dependencies:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"], // Build dependencies first
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false, // Don't cache dev server
      "persistent": true
    }
  }
}
```

## 🔄 Development Workflow

1. **Make changes** in any package or app
2. **Type safety propagates** automatically across dependent packages
3. **Hot reload** - Frontend auto-refreshes, backend restarts
4. **Pre-commit hooks** - Husky runs linting and type checking
5. **Commit** - Changes are validated before commit

### Adding a New Feature

```bash
# Example: Add a new tRPC router
cd packages/api/src/routers
touch products.router.ts

# The new router is automatically available in apps/web via tRPC client
```

## 🌍 Environment Variables

All environment variables are defined in a single `.env` file at the root.

**Required Variables:**

```env
# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/db_name

# Server (required)
PORT=3000
NODE_ENV=development

# Authentication (required)
JWT_SECRET=your-secret-key-min-32-chars

# Email (optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Storage (optional)
STORAGE_PATH=./uploads
MAX_FILE_SIZE=5242880  # 5MB in bytes

# Logging (optional)
LOG_LEVEL=info
```

> **⚠️ Security**: Never commit `.env` to version control. Use `.env.example` as a template.

## 📚 Key Concepts

### Type Safety Flow

```
Database Schema (Drizzle)
    ↓
Zod Schemas (@tepian-k3/schema)
    ↓
tRPC Routers (@tepian-k3/api)
    ↓
Frontend Client (apps/web)
```

### Dependency Order

```
constants → types → schema → db → queries → services → api → apps
```

Packages are built in dependency order automatically by Turborepo.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run `pnpm check-types && pnpm lint`
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) - Project template
- [Turborepo](https://turbo.build) - Monorepo build system
- [tRPC](https://trpc.io) - End-to-end type safety
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM

---

**Built with ❤️ using Better-T-Stack**
