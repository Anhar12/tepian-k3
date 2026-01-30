# Refresh Token Quick Reference

Quick examples for using the refresh token authentication system.

## Login with Dual Tokens

```typescript
import { trpc } from "@/utils/trpc";

// Login returns both tokens
const { accessToken, refreshToken, user } = await trpc.auth.login.mutate({
  email: "user@example.com",
  password: "password123",
});

// Store tokens
localStorage.setItem("accessToken", accessToken);
localStorage.setItem("refreshToken", refreshToken);
```

## Refresh Access Token

```typescript
// When access token expires (after 15 minutes)
const { accessToken, refreshToken } = await trpc.auth.refresh.mutate({
  refreshToken: localStorage.getItem("refreshToken"),
});

// Update stored tokens
localStorage.setItem("accessToken", accessToken);
localStorage.setItem("refreshToken", refreshToken); // Old one is revoked
```

## Session Management

```typescript
// Get all active sessions
const sessions = await trpc.auth.getSessions.query();

// Revoke specific session
await trpc.auth.revokeSession.mutate({
  sessionId: "uuid-of-session-to-revoke",
});

// Logout from all devices
await trpc.auth.revokeAllSessions.mutate();
```

## Token Expiry Defaults

- **Access Token**: 15 minutes (can be configured via `JWT_ACCESS_TOKEN_EXPIRY`)
- **Refresh Token**: 30 days (can be configured via `JWT_REFRESH_TOKEN_EXPIRY`)

## Environment Variables

```bash
JWT_SECRET=your_access_token_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=30d
```

Generate secrets:

```bash
openssl rand -base64 32
```

## Security Features

✅ **Token Rotation**: Refresh tokens are one-time-use
✅ **Session Tracking**: Track device, IP, user agent
✅ **Immediate Revocation**: Revoke sessions from database
✅ **Short-lived Access**: Reduced attack window (15 min vs 30 days)
✅ **Permission Refresh**: Latest roles/permissions fetched on token refresh

## See Also

- [Full Refresh Token Guide](../../../docs/REFRESH_TOKEN_GUIDE.md)
- [CLAUDE.md](../../../CLAUDE.md) - Project documentation
