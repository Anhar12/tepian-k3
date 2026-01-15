# Refresh Token Implementation Guide

This guide documents the refresh token authentication pattern implemented in the tepian-k3 application, which replaces the previous long-lived access token approach with a more secure dual-token system.

## Overview

The application now uses a **dual-token authentication system**:

- **Access Token**: Short-lived (15 minutes default) JWT containing user credentials, roles, and permissions
- **Refresh Token**: Long-lived (30 days default) JWT used to obtain new access tokens without re-login

## Benefits Over Previous Implementation

### Security Improvements

1. **Reduced Attack Window**: Stolen access tokens expire in 15 minutes vs 30 days
2. **Session Revocation**: Can immediately invalidate specific sessions from the database
3. **Token Rotation**: Refresh tokens are one-time-use (rotated on each refresh)
4. **Granular Control**: Can revoke individual sessions without affecting all user sessions

### Operational Benefits

1. **Permission Updates**: Changes to roles/permissions take effect within 15 minutes
2. **Session Management**: Track and manage active sessions per user
3. **Device Tracking**: Monitor which devices are accessing the system
4. **Audit Trail**: Full logging of session creation, refresh, and revocation

## Architecture

### Database Schema

**Table**: `refresh_tokens`

```sql
CREATE TABLE "refresh_tokens" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "token" text NOT NULL UNIQUE,
  "device_info" text,
  "ip_address" varchar(45),
  "user_agent" text,
  "last_used_at" timestamp with time zone,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked" boolean DEFAULT false NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);
```

**Indexes**:
- `refresh_token_user_id_idx` - Fast user session lookups
- `refresh_token_token_idx` - Fast token validation
- `refresh_token_expires_at_idx` - Efficient cleanup queries

### Token Types

#### Access Token Payload

```typescript
{
  id: string;              // User ID
  email: string;
  roles: string[];         // Array of role names
  permissions: string[];   // Array of permission strings
  createdAt: string;
  updatedAt: string | null;
  exp: number;            // Expires in 15 minutes
  iat: number;            // Issued at timestamp
  jti: string;            // JWT ID (unique per token)
}
```

#### Refresh Token Payload

```typescript
{
  id: string;             // User ID
  sessionId: string;      // Unique session identifier
  type: "refresh";        // Token type marker
  exp: number;           // Expires in 30 days
  iat: number;           // Issued at timestamp
}
```

## Environment Variables

Add these to your `.env` file:

```bash
# Main JWT secret for access tokens
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# Refresh token secret (must be different from JWT_SECRET)
JWT_REFRESH_SECRET=your_refresh_token_secret_key_min_32_chars

# Token expiration times
JWT_ACCESS_TOKEN_EXPIRY=15m   # Access token expiry (default: 15m)
JWT_REFRESH_TOKEN_EXPIRY=30d  # Refresh token expiry (default: 30d)
```

**Generate secrets**:
```bash
openssl rand -base64 32
```

## API Endpoints

### 1. Login

**Endpoint**: `auth.login`
**Type**: Mutation
**Access**: Public

**Request**:
```typescript
{
  email: string;
  password: string;
}
```

**Response**:
```typescript
{
  accessToken: string;    // Short-lived JWT
  refreshToken: string;   // Long-lived JWT (store securely)
  user: {
    id: string;
    email: string;
    name: string;
    roles: Array<{ id: string; name: string; }>;
    permissions: string[];
    // ... other user fields
  };
}
```

### 2. Refresh Token

**Endpoint**: `auth.refresh`
**Type**: Mutation
**Access**: Public

**Request**:
```typescript
{
  refreshToken: string;
}
```

**Response**:
```typescript
{
  accessToken: string;     // New short-lived JWT
  refreshToken: string;    // New long-lived JWT (old one is revoked)
}
```

**Notes**:
- Old refresh token is revoked (one-time-use)
- Returns new access token with latest permissions
- Automatically updates `lastUsedAt` timestamp

### 3. Get Active Sessions

**Endpoint**: `auth.getSessions`
**Type**: Query
**Access**: Protected (requires valid access token)

**Response**:
```typescript
Array<{
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  expiresAt: string;
}>
```

### 4. Revoke Session

**Endpoint**: `auth.revokeSession`
**Type**: Mutation
**Access**: Protected

**Request**:
```typescript
{
  sessionId: string;  // UUID of the session to revoke
}
```

**Response**:
```typescript
{
  success: true;
  message: "Sesi berhasil dicabut.";
}
```

### 5. Revoke All Sessions

**Endpoint**: `auth.revokeAllSessions`
**Type**: Mutation
**Access**: Protected

**Response**:
```typescript
{
  success: true;
  message: "Semua sesi berhasil dicabut.";
}
```

## Frontend Integration

### 1. Store Tokens Securely

**Best Practice**: Store refresh token in httpOnly cookie (server-side) or secure storage (mobile apps).

For web apps using localStorage (temporary during migration):

```typescript
// After login
const result = await trpc.auth.login.mutate({ email, password });

// Store tokens
localStorage.setItem('accessToken', result.accessToken);
localStorage.setItem('refreshToken', result.refreshToken);
```

### 2. Token Refresh Logic

**Option A: Interceptor Pattern** (Recommended)

```typescript
// apps/web/src/utils/trpc.ts
import { httpBatchLink } from '@trpc/client';

let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function refreshTokens() {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch('http://localhost:3000/trpc/auth.refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: localStorage.getItem('refreshToken'),
        }),
      });

      const data = await response.json();

      if (data.result?.data) {
        accessToken = data.result.data.accessToken;
        refreshToken = data.result.data.refreshToken;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      } else {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      window.location.href = '/login';
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
      async headers() {
        return {
          authorization: accessToken ? `Bearer ${accessToken}` : '',
        };
      },
      // Retry on 401 errors
      fetch: async (url, options) => {
        const response = await fetch(url, options);

        if (response.status === 401 && refreshToken) {
          // Token expired, try to refresh
          await refreshTokens();

          // Retry original request with new token
          const newOptions = {
            ...options,
            headers: {
              ...options?.headers,
              authorization: `Bearer ${accessToken}`,
            },
          };
          return fetch(url, newOptions);
        }

        return response;
      },
    }),
  ],
});
```

**Option B: Manual Refresh Check** (Simpler, but less efficient)

```typescript
// Check token expiry before each request
import { jwtDecode } from 'jwt-decode';

async function ensureValidToken() {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  const decoded = jwtDecode(token);
  const now = Date.now() / 1000;

  // Refresh if token expires in less than 5 minutes
  if (decoded.exp && decoded.exp - now < 300) {
    await refreshTokens();
  }

  return true;
}

// Use before protected operations
await ensureValidToken();
const data = await trpc.auth.profile.query();
```

### 3. Handle Token Refresh Errors

```typescript
try {
  await refreshTokens();
} catch (error) {
  // Refresh failed - user must re-login
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  // Redirect to login
  router.push('/login');
}
```

## Security Considerations

### 1. Refresh Token Storage

**Web Applications**:
- ✅ **Recommended**: httpOnly, secure cookies (not accessible to JavaScript)
- ⚠️ **Acceptable**: localStorage (vulnerable to XSS, use only if cookies not possible)
- ❌ **Not Recommended**: sessionStorage, regular cookies

**Mobile Applications**:
- ✅ **Recommended**: Secure keychain (iOS) or KeyStore (Android)
- ❌ **Not Recommended**: AsyncStorage, SharedPreferences (unencrypted)

### 2. Token Rotation

Refresh tokens are **one-time-use** (rotated on each refresh):

```typescript
// When user refreshes:
1. Validate old refresh token
2. Generate new access token
3. Generate new refresh token
4. Revoke old refresh token
5. Store new refresh token in database
6. Return both new tokens to client
```

This prevents:
- Token replay attacks
- Concurrent session hijacking
- Long-term token compromise

### 3. Revocation Strategies

**Immediate Revocation**:
```typescript
// Revoke specific session
await trpc.auth.revokeSession.mutate({ sessionId });

// User must use refresh token to get new access token
// Revoked refresh tokens will fail validation
```

**Logout All Devices**:
```typescript
// Revoke all user sessions
await trpc.auth.revokeAllSessions.mutate();

// User must re-login on all devices
```

### 4. Cleanup Old Tokens

**Manual Cleanup**:
```typescript
// packages/queries/src/refresh-tokens.queries.ts
await refreshTokensQueries.deleteExpiredTokens();
```

**Automated Cleanup** (recommended):
```typescript
// Add to cron job or scheduled task
// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  await runEffect(refreshTokensQueries.deleteExpiredTokens());
  console.log('Expired refresh tokens cleaned up');
});
```

## Migration from Long-Lived Tokens

### Backward Compatibility

The implementation maintains backward compatibility:

```typescript
// Old login endpoint still works (uses legacy encrypt function)
const token = await encrypt({
  id: user.id,
  email: user.email,
  // ... payload
});

// Returns single token for backward compatibility
return { token };
```

### Migration Steps

1. **Update backend** (✅ Complete)
   - Database schema with refresh_tokens table
   - JWT service with dual token support
   - Auth router with refresh endpoints

2. **Update frontend** (⚠️ Pending)
   - Modify login flow to handle both tokens
   - Implement token refresh interceptor
   - Update token storage strategy

3. **Test thoroughly**
   - Login flow with new token system
   - Token refresh on expiry
   - Session management UI
   - Revocation scenarios

4. **Deploy gradually**
   - Deploy backend first (backward compatible)
   - Update frontend clients incrementally
   - Monitor for issues in production

## Troubleshooting

### Access Token Expired Error

**Error**: `401 Unauthorized - Token expired`

**Solution**: Implement automatic token refresh (see Frontend Integration section)

### Refresh Token Invalid

**Error**: `Refresh token tidak valid atau telah kedaluwarsa`

**Causes**:
1. Token expired (after 30 days)
2. Token revoked (session terminated)
3. Token used twice (replay attack)
4. User changed password (all sessions revoked)

**Solution**: Redirect user to login page

### Token Refresh Loop

**Symptoms**: Continuous refresh requests, high CPU usage

**Causes**:
1. Access token expiry set too short (< 5 minutes)
2. Missing refresh token in request
3. Clock skew between client and server

**Solution**:
```typescript
// Increase access token expiry
JWT_ACCESS_TOKEN_EXPIRY=15m  // At least 15 minutes

// Check system time synchronization
// Ensure server and client clocks are in sync
```

## Performance Considerations

### Token Validation Overhead

**Access Token**: Stateless (no DB query) - verified using JWT signature
**Refresh Token**: Stateful (requires DB query) - validated against database

**Optimization**: Cache refresh token validation results (5-10 seconds) using Redis:

```typescript
// Optional: Add Redis cache for refresh token validation
const cached = await redis.get(`refresh_token:${token}`);
if (cached) return JSON.parse(cached);

const result = await db.query.refreshTokens.findFirst({ ... });
await redis.setex(`refresh_token:${token}`, 10, JSON.stringify(result));
return result;
```

### Database Cleanup

Run cleanup query periodically to prevent table bloat:

```sql
-- Delete expired/revoked tokens older than 7 days
DELETE FROM refresh_tokens
WHERE (expires_at < CURRENT_TIMESTAMP OR revoked = true)
  AND created_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
```

## Testing

### Unit Tests

```typescript
describe('Refresh Token Flow', () => {
  it('should create access and refresh tokens on login', async () => {
    const result = await trpc.auth.login.mutate({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('should refresh tokens successfully', async () => {
    const loginResult = await trpc.auth.login.mutate({ ... });

    const refreshResult = await trpc.auth.refresh.mutate({
      refreshToken: loginResult.refreshToken,
    });

    expect(refreshResult.accessToken).toBeDefined();
    expect(refreshResult.refreshToken).not.toBe(loginResult.refreshToken);
  });

  it('should fail with revoked refresh token', async () => {
    const loginResult = await trpc.auth.login.mutate({ ... });
    await trpc.auth.revokeSession.mutate({ sessionId: '...' });

    await expect(
      trpc.auth.refresh.mutate({ refreshToken: loginResult.refreshToken })
    ).rejects.toThrow('Refresh token tidak valid');
  });
});
```

## Monitoring

### Metrics to Track

1. **Token Refresh Rate**: Frequency of refresh token usage
2. **Failed Refresh Attempts**: May indicate attack or configuration issue
3. **Average Session Duration**: Time between login and last refresh
4. **Active Sessions per User**: Detect account sharing or compromise

### Logging

```typescript
// Log refresh token events
logger.info('Token refreshed', {
  userId: user.id,
  ipAddress: ctx.req.ip,
  userAgent: ctx.req.headers['user-agent'],
  oldTokenId: oldToken.id,
  newTokenId: newToken.id,
});

// Log revocation events
logger.warn('Session revoked', {
  userId: user.id,
  sessionId: session.id,
  revokedBy: ctx.user.id,
  reason: 'user_request', // or 'suspicious_activity', 'password_change'
});
```

## Further Reading

- [RFC 6749 - OAuth 2.0 Refresh Tokens](https://tools.ietf.org/html/rfc6749#section-1.5)
- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [JWT Handbook - Token Refresh](https://auth0.com/resources/ebooks/jwt-handbook)
