# OTP Verification with Refresh Token Support

This guide explains how the OTP (One-Time Password) verification system works with access and refresh token generation in the tepian-k3 application.

## Overview

The OTP service has been updated to support the modern authentication pattern using both access tokens (short-lived) and refresh tokens (long-lived). When a user verifies their email via OTP, they receive both tokens, enabling them to:

1. Authenticate API requests with the access token
2. Obtain new access tokens without re-authentication using the refresh token
3. Track and manage active sessions across multiple devices

## Architecture

### Token Types

1. **Access Token**
   - Short-lived (15 minutes by default, configurable via `JWT_ACCESS_TOKEN_EXPIRY`)
   - Used for API authentication
   - Contains user ID, email, roles, and permissions
   - Signed with `JWT_SECRET`

2. **Refresh Token**
   - Long-lived (30 days)
   - Used to obtain new access tokens
   - Contains user ID, session ID, and token type
   - Signed with `JWT_REFRESH_SECRET`
   - Stored in database with device information

## Flow Diagram

```
┌─────────────┐
│ User enters │
│    email    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ OTP sent to │
│    email    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ User enters │
│     OTP     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  OTP Verified           │
│  ├─ Mark email verified │
│  ├─ Generate access     │
│  │  token (15 min)      │
│  ├─ Generate refresh    │
│  │  token (30 days)     │
│  └─ Store refresh token │
│     in database         │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Return both tokens to   │
│ client                  │
└─────────────────────────┘
```

## Implementation Details

### OTPService.verifyOTP()

The `verifyOTP` method now:

1. Validates the OTP code
2. Marks the OTP as verified
3. Marks the user's email as verified
4. Generates an **access token** with user permissions
5. Generates a **refresh token** with a unique session ID
6. Stores the refresh token in the database with device information
7. Returns both tokens to the client

```typescript
const result = await OTPService.verifyOTP(
  { email, code },
  {
    userAgent: ctx.userAgent,
    ipAddress: ctx.ip,
    os: ctx.osName,
    version: ctx.osVersion,
  },
);

// Returns:
// {
//   success: true,
//   message: "OTP berhasil diverifikasi.",
//   userId: "user-uuid",
//   accessToken: "eyJhbGc...",
//   refreshToken: "eyJhbGc..."
// }
```

### Device Information Tracking

The OTP service now accepts optional device information to track sessions:

- `userAgent`: Browser/client user agent string
- `ipAddress`: IP address of the client
- `os`: Operating system name
- `version`: OS version

This information is stored in the `refreshTokens` table and helps users:

- Identify active sessions
- Revoke sessions from specific devices
- Monitor security with session tracking

## Database Schema

The refresh token is stored in the `refreshTokens` table:

```typescript
{
  id: uuid (primary key),
  userId: uuid (foreign key to users),
  token: string (the JWT),
  expiresAt: timestamp,
  lastUsedAt: timestamp,
  revokedAt: timestamp (nullable),
  deviceInfo: string (nullable),
  ipAddress: string (nullable),
  userAgent: string (nullable),
  os: string (nullable),
  version: string (nullable),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp (nullable)
}
```

## API Usage

### 1. Request OTP

```typescript
const result = await trpcClient.auth.sendOTP.mutate({
  email: "user@example.com",
});
```

### 2. Verify OTP

```typescript
const result = await trpcClient.auth.verifyOTP.mutate({
  email: "user@example.com",
  code: "123456",
});

// Response:
// {
//   success: true,
//   message: "OTP berhasil diverifikasi.",
//   userId: "uuid",
//   accessToken: "eyJhbGc...",
//   refreshToken: "eyJhbGc..."
// }
```

### 3. Store Tokens on Client

```typescript
// Store both tokens securely
localStorage.setItem("accessToken", result.accessToken);
localStorage.setItem("refreshToken", result.refreshToken);

// Use access token for API requests
const headers = {
  Authorization: `Bearer ${accessToken}`,
};
```

### 4. Refresh Access Token

When the access token expires:

```typescript
const result = await trpcClient.auth.refresh.mutate({
  refreshToken: localStorage.getItem("refreshToken"),
});

// Response:
// {
//   accessToken: "new-access-token",
//   refreshToken: "new-refresh-token"
// }

// Update stored tokens
localStorage.setItem("accessToken", result.accessToken);
localStorage.setItem("refreshToken", result.refreshToken);
```

### 5. Logout

```typescript
await trpcClient.auth.logout.mutate({
  refreshToken: localStorage.getItem("refreshToken"),
});

// Clear stored tokens
localStorage.removeItem("accessToken");
localStorage.removeItem("refreshToken");
```

## Security Features

### 1. Token Rotation

When refreshing, the old refresh token is revoked and a new one is issued. This prevents token reuse and enhances security.

### 2. Session Tracking

All refresh tokens are tracked in the database with device information, allowing users to:

- View active sessions
- Revoke specific sessions
- Revoke all sessions (except current)

### 3. Rate Limiting

OTP operations are rate-limited:

- `sendOTP`: Limited to prevent abuse
- `verifyOTP`: Limited to prevent brute force attacks
- `refresh`: Limited to prevent token refresh abuse

### 4. Soft Delete Support

Refresh tokens support soft deletion, maintaining audit trail while preventing token reuse.

## Frontend Integration Example

```typescript
// In your auth context or store
import { trpcClient } from "@/utils/trpc";

export const useAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const verifyOTP = async (email: string, code: string) => {
    try {
      const result = await trpcClient.auth.verifyOTP.mutate({
        email,
        code,
      });

      if (result.success) {
        setAccessToken(result.accessToken);
        setRefreshToken(result.refreshToken);
        localStorage.setItem("accessToken", result.accessToken);
        localStorage.setItem("refreshToken", result.refreshToken);
      }

      return result;
    } catch (error) {
      console.error("OTP verification failed:", error);
      throw error;
    }
  };

  const refreshAccessToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (!storedRefreshToken) {
        throw new Error("No refresh token available");
      }

      const result = await trpcClient.auth.refresh.mutate({
        refreshToken: storedRefreshToken,
      });

      setAccessToken(result.accessToken);
      setRefreshToken(result.refreshToken);
      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("refreshToken", result.refreshToken);

      return result;
    } catch (error) {
      // Refresh failed, user needs to re-authenticate
      logout();
      throw error;
    }
  };

  const logout = async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (storedRefreshToken) {
      try {
        await trpcClient.auth.logout.mutate({
          refreshToken: storedRefreshToken,
        });
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }

    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  return {
    accessToken,
    refreshToken,
    verifyOTP,
    refreshAccessToken,
    logout,
  };
};
```

## Automatic Token Refresh

You can implement automatic token refresh in your API client:

```typescript
import { httpBatchLink } from "@trpc/client";

const trpcClient = createTRPCClient({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/trpc",
      headers: async () => {
        let accessToken = localStorage.getItem("accessToken");

        // Check if token is about to expire (optional)
        if (isTokenExpiringSoon(accessToken)) {
          try {
            const refreshToken = localStorage.getItem("refreshToken");
            const result = await fetch("/trpc/auth.refresh", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            });

            const data = await result.json();
            accessToken = data.result.accessToken;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", data.result.refreshToken);
          } catch (error) {
            // Refresh failed, redirect to login
            window.location.href = "/login";
          }
        }

        return {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        };
      },
    }),
  ],
});
```

## Comparison: Before vs After

### Before (Access Token Only)

```typescript
// Old return format
{
  success: true,
  message: "OTP berhasil diverifikasi.",
  userId: "uuid",
  token: "long-lived-access-token" // 30 days
}
```

**Issues:**

- Long-lived tokens are security risks
- No way to revoke tokens without database check
- No session tracking
- Token compromise = 30-day exposure

### After (Access + Refresh Tokens)

```typescript
// New return format
{
  success: true,
  message: "OTP berhasil diverifikasi.",
  userId: "uuid",
  accessToken: "short-lived-token", // 15 minutes
  refreshToken: "long-lived-token"  // 30 days, in database
}
```

**Benefits:**

- Short-lived access tokens reduce exposure window
- Refresh tokens can be revoked immediately
- Session tracking across devices
- Better security posture
- User can manage active sessions

## Error Handling

```typescript
try {
  const result = await OTPService.verifyOTP(input, deviceInfo);

  if (!result.success) {
    // Handle verification failure
    // - Invalid OTP
    // - Expired OTP
    // - Max attempts exceeded
  }

  return result;
} catch (error) {
  if (error instanceof OTPError) {
    // Handle OTP-specific errors
    console.error(error.message);
  }
  throw error;
}
```

## Environment Variables

Ensure these environment variables are set:

```env
# Access token configuration
JWT_SECRET=your-access-token-secret-min-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m  # 15 minutes

# Refresh token configuration
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars
JWT_REFRESH_TOKEN_EXPIRY=30d  # 30 days

# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/db
```

## Testing

### Unit Test Example

```typescript
import { OTPService } from "@tepian-k3/auth/services/otp";

describe("OTPService.verifyOTP", () => {
  it("should return both access and refresh tokens", async () => {
    const result = await OTPService.verifyOTP(
      { email: "test@example.com", code: "123456" },
      {
        userAgent: "Mozilla/5.0...",
        ipAddress: "127.0.0.1",
        os: "Windows",
        version: "10",
      },
    );

    expect(result.success).toBe(true);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.userId).toBeDefined();
  });
});
```

## Migration Notes

If you're migrating from the old single-token system:

1. Update frontend to handle both tokens
2. Implement automatic token refresh
3. Update logout to use refresh token
4. Test token rotation flow
5. Monitor session tracking

## Related Documentation

- [Refresh Token Example](./refresh-token-example.md)
- [Authentication Guide](../../../docs/EMPLOYEE_AUTH_GUIDE.md)
- [Rate Limiting Middleware](../../api/docs/RATE_LIMITING_MIDDLEWARE.md)

## Troubleshooting

### Access token expires too quickly

- Check `JWT_ACCESS_TOKEN_EXPIRY` environment variable
- Default is 15 minutes, adjust if needed
- Don't exceed 1 hour for security

### Refresh token not stored in database

- Verify `refreshTokensQueries.createRefreshToken` is called
- Check database connection
- Ensure `refreshTokens` table exists

### Device information not captured

- Verify context contains `userAgent`, `ip`, `osName`, `osVersion`
- Check Hono middleware for context population
- Ensure headers are passed correctly

### Token rotation fails

- Verify old token is revoked before creating new one
- Check `refreshTokensQueries.revokeToken` implementation
- Ensure transaction completes successfully
