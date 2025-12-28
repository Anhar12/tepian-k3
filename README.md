# tepian-k3

A modern TypeScript monorepo built with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), featuring React, TanStack Router, Hono, tRPC, and managed by Turborepo for optimal build performance.

## Tech Stack

### Frontend

- **React** - UI library
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **PWA** - Progressive Web App support with offline capabilities

### Backend

- **Hono** - Lightweight, performant server framework
- **tRPC** - End-to-end type-safe APIs
- **Node.js** - Runtime environment
- **Effect** - Functional programming for error handling

### Database

- **PostgreSQL** - Database engine
- **Drizzle ORM** - TypeScript-first ORM

### Monorepo Tools

- **Turborepo** - High-performance build system for monorepos
- **pnpm** - Fast, disk space efficient package manager
- **pnpm workspaces** - Workspace management

### Developer Experience

- **TypeScript** - Full type safety across the stack
- **Husky** - Git hooks for code quality
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Getting Started

### Prerequisites

- **Node.js** 18+ and **pnpm** 8+
- **PostgreSQL** database instance

### Installation

Install dependencies using pnpm:

```bash
pnpm install
```

### Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Create a `.env` file at the root of the monorepo with all necessary environment variables (see Environment Variables section below).

3. Apply the schema to your database:

```bash
pnpm run db:push
```

4. (Optional) Seed the database:

```bash
pnpm run db:seed
```

### Running the Project

Start all applications in development mode with Turborepo:

```bash
pnpm run dev
```

This will start:

- **Web App**: [http://localhost:3001](http://localhost:3001)
- **API Server**: [http://localhost:3000](http://localhost:3000)

Turborepo will handle caching and run tasks in parallel for optimal performance.

## Monorepo Structure

This is a Turborepo monorepo with the following structure:

```
tepian-k3/
├── apps/
│   ├── web/                    # Frontend application
│   │   ├── src/
│   │   │   ├── routes/        # TanStack Router file-based routes
│   │   │   ├── components/    # React components
│   │   │   └── utils/         # Frontend utilities
│   │   └── public/            # Static assets
│   └── server/                 # Backend API server
│       ├── src/
│       │   └── index.ts       # Hono server entry point
│       ├── logs/              # Server logs
│       └── uploads/           # User uploaded files
├── packages/
│   ├── api/                    # tRPC API routers & procedures
│   ├── auth/                   # Authentication logic & utilities
│   ├── config/                 # Shared configuration (tsconfig.base.json)
│   ├── constants/              # Shared constants
│   ├── db/                     # Drizzle ORM schema & client
│   │   ├── src/
│   │   │   ├── schema.ts      # Database schema definitions
│   │   │   ├── client.ts      # Database client instance
│   │   │   └── migrations/    # Database migrations
│   │   └── drizzle.config.ts  # Drizzle configuration
│   ├── queries/                # Database query functions
│   ├── schema/                 # Zod validation schemas
│   ├── services/               # External services (email, storage, logger)
│   ├── shared/                 # Shared utilities & configurations
│   ├── types/                  # Shared TypeScript types
│   └── utils/                  # Shared utility functions
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace configuration
└── package.json                # Root package with workspace scripts
```

### Workspace Packages

All packages in the monorepo are managed by pnpm workspaces and built with Turborepo:

- **Apps**: Deployable applications (`apps/*`)
- **Packages**: Shared libraries used across apps (`packages/*`)

Each package has its own `package.json` and can be imported using the `@tepian-k3/*` namespace.

## Available Scripts

All scripts are run from the root of the monorepo using Turborepo for optimized execution.

### Development

- `pnpm run dev` - Start all apps in development mode (with hot reload)
- `pnpm run dev:web` - Start only the web application
- `pnpm run dev:server` - Start only the server

### Building

- `pnpm run build` - Build all applications and packages
- `pnpm run build:web` - Build only the web application
- `pnpm run build:server` - Build only the server

### Type Checking & Linting

- `pnpm run check-types` - Type check all TypeScript across the monorepo
- `pnpm run lint` - Lint all packages

### Database Management

- `pnpm run db:push` - Push schema changes to database (development)
- `pnpm run db:studio` - Open Drizzle Studio (database GUI)
- `pnpm run db:migrate` - Run database migrations
- `pnpm run db:seed` - Seed the database with initial data
- `pnpm run db:reset` - Reset database and re-run migrations

### PWA Assets

- `cd apps/web && pnpm run generate-pwa-assets` - Generate PWA icons and splash screens

### Workspace Management

- `pnpm install` - Install all dependencies across workspaces
- `pnpm add <package> -w` - Add a dependency to the root workspace
- `pnpm add <package> --filter @tepian-k3/web` - Add a dependency to a specific package

## Turborepo Features

This monorepo leverages Turborepo for:

- **Parallel Execution** - Runs tasks across multiple packages simultaneously
- **Smart Caching** - Caches build outputs and skips unnecessary rebuilds
- **Dependency Graph** - Understands package relationships and builds in correct order
- **Remote Caching** - Share cache across team members (configurable)
- **Incremental Builds** - Only rebuilds what changed

### Cache Management

```bash
# Clear Turborepo cache
pnpm turbo run build --force

# View cache info
pnpm turbo run build --dry-run
```

## Development Workflow

1. **Make changes** in any package or app
2. **Type safety** - Changes propagate across dependent packages
3. **Hot reload** - Frontend auto-refreshes, backend restarts automatically
4. **Commit** - Husky runs pre-commit hooks for linting and type checking

## Environment Variables

All environment variables are managed in a single `.env` file at the root of the monorepo. This file is shared across all apps and packages.

Create a `.env` file at the root with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tepian_k3

# Server
PORT=3000
NODE_ENV=development

# JWT/Auth
JWT_SECRET=your-secret-key

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Storage (optional)
STORAGE_PATH=./uploads

# Add other environment variables as needed
```

> **Note**: Refer to `.env.example` at the root for all required variables and their descriptions.
