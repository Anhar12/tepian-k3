# Rate Limiter Service Changelog

## v1.0.0 - 2026-01-16

### Initial Release

#### Features

- **Multiple Rate Limiting Strategies**
  - Sliding Window (most accurate)
  - Token Bucket (good for burst traffic)
  - Fixed Window (simplest)

- **Redis Integration**
  - Distributed rate limiting across multiple servers
  - Atomic operations using Lua scripts
  - Automatic fallback to in-memory storage

- **8 Preset Configurations**
  - AUTH: 5 attempts per 15 minutes
  - API: 1000 requests per hour
  - EMAIL: 10 emails per hour
  - OTP: 3 attempts per 5 minutes
  - PASSWORD_RESET: 3 attempts per hour
  - STRICT: 10 requests per minute
  - MODERATE: 30 requests per minute
  - LENIENT: 100 requests per minute

- **Comprehensive API**
  - consume() - Consume rate limit points
  - get() - Get current status
  - reset() - Reset rate limit
  - penalty() - Block immediately
  - reward() - Add points back
  - isBlocked() - Check if blocked
  - getRemaining() - Get remaining points

#### Files Added

- `types.ts` - Type definitions and interfaces
- `storage/redis-storage.ts` - Redis-backed storage
- `storage/memory-storage.ts` - In-memory fallback storage
- `rate-limiter.ts` - Main rate limiter class
- `index.ts` - Service factory and exports
- `README.md` - Quick start guide
- `docs/README.md` - Complete documentation
- `docs/INTEGRATION_GUIDE.md` - Integration examples
- `docs/examples/api-rate-limiting.example.md` - API examples
- `docs/examples/auth-rate-limiting.example.md` - Auth examples
- `docs/examples/trpc-integration.example.ts` - tRPC integration

#### Configuration

- Added `./rate-limiter` export to package.json
- Updated CLAUDE.md with service documentation
- Excluded example files from TypeScript compilation

#### Bug Fixes

- Fixed duplicate RateLimiterService export
- Fixed storage strategy type errors
- Fixed Map iterator compatibility issues
- Fixed Redis zrange type safety

#### Documentation

- Complete API documentation
- Integration guide for tRPC and Hono
- Real-world usage examples
- Best practices and troubleshooting
- Project-level guide in docs/RATE_LIMITER_GUIDE.md

#### Testing

- All TypeScript errors resolved
- Import validation successful
- Ready for production use
