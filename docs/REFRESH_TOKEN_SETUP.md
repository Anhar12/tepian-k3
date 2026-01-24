# Refresh Token Setup Guide

Quick guide to get the refresh token system running.

## ✅ Backend (Complete)

All backend components are ready:
- Database schema with `refresh_tokens` table
- JWT service with dual-token support
- Auth router with refresh endpoints
- Session management queries

## 🔧 Required Configuration

### 1. Add Environment Variables

Add these to your `.env` file:

```bash
# Generate secrets with: openssl rand -base64 32
JWT_REFRESH_SECRET=<your-refresh-secret-here>

# Token expiry (optional, has defaults)
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=30d
```

**Important**: `JWT_REFRESH_SECRET` must be different from `JWT_SECRET`!

### 2. Generate Secrets

```bash
# Generate JWT_REFRESH_SECRET
openssl rand -base64 32

# Should output something like:
# abc123XYZ456...789
```

## ✅ Frontend (Complete)

All frontend components are ready:
- tRPC client with automatic token refresh
- Login form updated to store both tokens
- Session management UI in settings page

## 🚀 How It Works

### Login Flow

```typescript
// User logs in
const { accessToken, refreshToken, user } = await trpc.auth.login.mutate({
  email: 'user@example.com',
  password: 'password123',
});

// Tokens automatically stored in localStorage
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

### Automatic Token Refresh

When access token expires (after 15 minutes):

1. ✅ tRPC client detects 401 error
2. ✅ Automatically calls `auth.refresh` with refresh token
3. ✅ Gets new access token + new refresh token
4. ✅ Old refresh token is revoked (one-time-use)
5. ✅ Retries the failed request with new token
6. ✅ All happens transparently - user stays logged in!

### Session Management

Users can view and manage their active sessions at `/settings`:

- ✅ View all active sessions (devices, browsers, last activity)
- ✅ Revoke specific sessions
- ✅ Logout from all devices

## 🧪 Testing

### 1. Test Login

```bash
# Start the app
pnpm dev

# Login at http://localhost:3001/login
# Check browser DevTools > Application > Local Storage
# Should see: accessToken and refreshToken
```

### 2. Test Auto Refresh

```bash
# Wait 15 minutes (or temporarily change JWT_ACCESS_TOKEN_EXPIRY to 1m for testing)
# Make any API call
# Check Network tab - should see automatic refresh call
# User stays logged in without interruption
```

### 3. Test Session Management

```bash
# Visit http://localhost:3001/settings
# Should see list of active sessions
# Click "Logout Semua" to revoke all sessions
# Should redirect to login
```

## 📋 API Endpoints

### `auth.login`
Returns both tokens on successful login.

### `auth.refresh`
Exchange refresh token for new tokens (automatic via tRPC client).

### `auth.getSessions`
List user's active sessions.

### `auth.revokeSession`
Revoke specific session by ID.

### `auth.revokeAllSessions`
Logout from all devices.

## 🔐 Security Features

- ✅ **Short-lived access tokens**: 15 minutes
- ✅ **Token rotation**: Refresh tokens are one-time-use
- ✅ **Session tracking**: Device, IP, user agent
- ✅ **Immediate revocation**: Revoke sessions from database
- ✅ **Permission updates**: Latest roles/permissions on each refresh

## 🐛 Troubleshooting

### "No refresh token available" error
**Cause**: User logged in before refresh token implementation.
**Solution**: User needs to logout and login again.

### Token refresh loop
**Cause**: JWT secrets not configured correctly.
**Solution**: Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are different and min 32 chars.

### Session not showing in settings
**Cause**: Database migration not run.
**Solution**: Run `pnpm db:migrate` to create `refresh_tokens` table.

## 📚 Documentation

- [Complete Refresh Token Guide](./REFRESH_TOKEN_GUIDE.md)
- [Quick Reference](../packages/auth/docs/refresh-token-example.md)
- [CLAUDE.md](../CLAUDE.md) - Project documentation

## ✨ What's New

Compared to the old 30-day single token system:

| Feature | Before | After |
|---------|--------|-------|
| Token Expiry | 30 days | 15 minutes (access)<br>30 days (refresh) |
| Session Revocation | ❌ Not possible | ✅ Instant revocation |
| Token Rotation | ❌ No | ✅ One-time-use |
| Session Management | ❌ No | ✅ Full UI to manage |
| Permission Updates | 30 days | 15 minutes |
| Security | ⚠️ Medium | ✅ High |

## 🎉 You're Done!

The refresh token system is fully implemented and ready to use!

Just add the environment variables and restart your development server.
