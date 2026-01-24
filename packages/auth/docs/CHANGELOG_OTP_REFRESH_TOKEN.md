# Changelog: OTP Service Update - Refresh Token Support

**Date:** 2026-01-17
**Author:** Claude Code
**Version:** 1.1.0

## Summary

Updated the OTP verification service to implement the modern authentication pattern using both access tokens (short-lived) and refresh tokens (long-lived). This brings the OTP flow in line with the login flow and enhances security.

## Changes Made

### 1. Updated `packages/auth/src/services/otp.ts`

#### Imports Added
```typescript
import { createAccessToken, createRefreshToken } from "..";
import refreshTokensQueries from "@tepian-k3/queries/refresh-tokens.queries";
import { v7 as uuidv7 } from "uuid";
```

Removed:
```typescript
import { encrypt } from "..";  // Legacy single token function
```

#### `verifyOTP` Method Signature Changed

**Before:**
```typescript
static async verifyOTP(input: z.infer<typeof otpSchema.verifyOtpSchema>)
```

**After:**
```typescript
static async verifyOTP(
  input: z.infer<typeof otpSchema.verifyOtpSchema>,
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
    os?: string;
    version?: string;
  }
)
```

#### Token Generation Updated

**Before:**
```typescript
const token = yield* Effect.tryPromise({
  try: () =>
    encrypt({
      id: user.id,
      email: user.email,
      permissions: user.permissions,
      roles: user.roles.map((role) => role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,  // 30 days!
      iat: Math.floor(Date.now() / 1000),
      jti: user.id,
    }),
  catch: (error) => {
    logError("OTPService.verifyOTP", "Failed to generate auth token", {
      userId: user.id,
      error,
    });
    return new OTPError({
      status: false,
      message: "Gagal membuat token.",
    });
  },
});
```

**After:**
```typescript
// Create access token with short expiry
const accessToken = yield* Effect.tryPromise({
  try: () =>
    createAccessToken({
      id: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.name),
      permissions: user.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }),
  catch: (error) => {
    logError("OTPService.verifyOTP", "Failed to create access token", {
      userId: user.id,
      error,
    });
    return new OTPError({
      status: false,
      message: "Gagal membuat access token.",
    });
  },
});

// Create refresh token with long expiry
const sessionId = uuidv7();
const refreshTokenJWT = yield* Effect.tryPromise({
  try: () =>
    createRefreshToken({
      id: user.id,
      sessionId,
      type: "refresh",
    }),
  catch: (error) => {
    logError(
      "OTPService.verifyOTP",
      "Failed to create refresh token",
      {
        userId: user.id,
        error,
      }
    );
    return new OTPError({
      status: false,
      message: "Gagal membuat refresh token.",
    });
  },
});

// Store refresh token in database
const refreshTokenExpiry = new Date();
refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // 30 days

yield* refreshTokensQueries.createRefreshToken({
  userId: user.id,
  token: refreshTokenJWT,
  expiresAt: refreshTokenExpiry.toISOString(),
  deviceInfo: deviceInfo?.userAgent,
  ipAddress: deviceInfo?.ipAddress,
  userAgent: deviceInfo?.userAgent,
  os: deviceInfo?.os,
  version: deviceInfo?.version,
});

logInfo(
  "OTPService.verifyOTP",
  `OTP verified and tokens generated for ${email}`
);
```

#### Return Value Updated

**Before:**
```typescript
return {
  success: true,
  message: "OTP berhasil diverifikasi.",
  userId: otp.userId,
  token,  // Single long-lived token
};
```

**After:**
```typescript
return {
  success: true,
  message: "OTP berhasil diverifikasi.",
  userId: otp.userId,
  accessToken,   // Short-lived (15 min)
  refreshToken: refreshTokenJWT,  // Long-lived (30 days)
};
```

### 2. Updated `packages/api/src/routers/auth.ts`

#### `verifyOTP` Procedure Updated

**Before:**
```typescript
verifyOTP: withRateLimit(rateLimiters.otp())
  .input(otpSchema.verifyOtpSchema)
  .mutation(async ({ input }) => {
    const result = await OTPService.verifyOTP(input);

    if (!result.success) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: result.message,
      });
    }

    return result;
  }),
```

**After:**
```typescript
verifyOTP: withRateLimit(rateLimiters.otp())
  .input(otpSchema.verifyOtpSchema)
  .mutation(async ({ input, ctx }) => {
    const result = await OTPService.verifyOTP(input, {
      userAgent: ctx.userAgent,
      ipAddress: ctx.ip,
      os: ctx.osName,
      version: ctx.osVersion,
    });

    if (!result.success) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: result.message,
      });
    }

    return result;
  }),
```

Now passes device information from context to track sessions.

### 3. Documentation Added

Created comprehensive documentation:
- `packages/auth/docs/OTP_WITH_REFRESH_TOKEN.md` - Complete guide
- `packages/auth/docs/CHANGELOG_OTP_REFRESH_TOKEN.md` - This changelog

## Breaking Changes

### API Response Format Changed

The `verifyOTP` mutation now returns a different structure:

**Old Response:**
```typescript
{
  success: boolean;
  message: string;
  userId: string;
  token: string;  // Single long-lived token
}
```

**New Response:**
```typescript
{
  success: boolean;
  message: string;
  userId: string;
  accessToken: string;  // Short-lived (15 min)
  refreshToken: string; // Long-lived (30 days)
}
```

### Migration Required

Frontend code must be updated to:

1. **Store both tokens instead of one:**
   ```typescript
   // Old
   localStorage.setItem("token", result.token);

   // New
   localStorage.setItem("accessToken", result.accessToken);
   localStorage.setItem("refreshToken", result.refreshToken);
   ```

2. **Use access token for API calls:**
   ```typescript
   // Old
   headers: {
     Authorization: `Bearer ${localStorage.getItem("token")}`
   }

   // New
   headers: {
     Authorization: `Bearer ${localStorage.getItem("accessToken")}`
   }
   ```

3. **Implement token refresh logic:**
   ```typescript
   // When access token expires
   const result = await trpcClient.auth.refresh.mutate({
     refreshToken: localStorage.getItem("refreshToken")
   });

   localStorage.setItem("accessToken", result.accessToken);
   localStorage.setItem("refreshToken", result.refreshToken);
   ```

4. **Update logout to use refresh token:**
   ```typescript
   // Old
   localStorage.removeItem("token");

   // New
   await trpcClient.auth.logout.mutate({
     refreshToken: localStorage.getItem("refreshToken")
   });
   localStorage.removeItem("accessToken");
   localStorage.removeItem("refreshToken");
   ```

## Benefits

### Security Improvements

1. **Reduced Exposure Window**
   - Before: 30-day access token
   - After: 15-minute access token
   - Compromised token valid for much shorter time

2. **Token Revocation**
   - Before: No way to revoke tokens (must check database on every request)
   - After: Can revoke refresh tokens immediately in database

3. **Session Tracking**
   - Before: No session tracking
   - After: Track all active sessions with device information

4. **Token Rotation**
   - Before: Static token for 30 days
   - After: Fresh access token every 15 minutes, refresh token rotates on use

### User Experience

1. **Session Management**
   - View all active sessions
   - Revoke sessions from specific devices
   - "Log out all devices" functionality

2. **Seamless Authentication**
   - Access token refreshes automatically
   - No need to re-enter credentials
   - Up to 30 days between logins (via refresh token)

## Database Impact

### New Records Created

Each OTP verification now creates:
1. One record in `refreshTokens` table
2. Includes device information for session tracking

### Storage Considerations

- Refresh tokens stored in database (not huge impact)
- Automatic cleanup of expired tokens recommended
- Consider adding a cleanup job

## Performance Impact

- **Minimal**: One additional database insert per OTP verification
- **Negligible**: Token generation is fast (milliseconds)
- **Benefit**: Reduced database load on subsequent requests (no token validation needed)

## Testing Recommendations

### Test Cases to Add/Update

1. **OTP Verification Returns Both Tokens**
   ```typescript
   it("should return access and refresh tokens", async () => {
     const result = await OTPService.verifyOTP(input, deviceInfo);
     expect(result.accessToken).toBeDefined();
     expect(result.refreshToken).toBeDefined();
   });
   ```

2. **Refresh Token Stored in Database**
   ```typescript
   it("should store refresh token in database", async () => {
     const result = await OTPService.verifyOTP(input, deviceInfo);
     const storedToken = await refreshTokensQueries.findByToken(result.refreshToken);
     expect(storedToken).toBeDefined();
   });
   ```

3. **Device Information Captured**
   ```typescript
   it("should capture device information", async () => {
     const deviceInfo = {
       userAgent: "Mozilla/5.0...",
       ipAddress: "127.0.0.1",
       os: "Windows",
       version: "10"
     };
     const result = await OTPService.verifyOTP(input, deviceInfo);
     const storedToken = await refreshTokensQueries.findByToken(result.refreshToken);
     expect(storedToken.ipAddress).toBe("127.0.0.1");
   });
   ```

## Rollback Plan

If needed, rollback by:

1. Revert `packages/auth/src/services/otp.ts`:
   - Change back to `encrypt()` function
   - Remove refresh token generation
   - Return single `token` field

2. Revert `packages/api/src/routers/auth.ts`:
   - Remove device info parameters

3. Update frontend to use single token again

## Environment Variables

No new environment variables required. Uses existing:
- `JWT_SECRET` - For access tokens
- `JWT_REFRESH_SECRET` - For refresh tokens
- `JWT_ACCESS_TOKEN_EXPIRY` - Default: 15m
- `JWT_REFRESH_TOKEN_EXPIRY` - Default: 30d

## Related Changes

This change aligns the OTP flow with the existing login flow:
- `auth.login` already uses access + refresh tokens
- `auth.refresh` endpoint handles token rotation
- `auth.logout` revokes refresh tokens
- `auth.getSessions` lists active sessions

## Next Steps

### Frontend Updates Required

1. Update OTP verification component to handle both tokens
2. Implement automatic token refresh
3. Update logout flow
4. Add session management UI (optional)

### Optional Enhancements

1. Add cleanup job for expired refresh tokens
2. Add email notification for new sessions
3. Add session activity monitoring
4. Implement "suspicious login" detection

## Support

For questions or issues, refer to:
- [OTP with Refresh Token Guide](./OTP_WITH_REFRESH_TOKEN.md)
- [Refresh Token Example](./refresh-token-example.md)
- CLAUDE.md for project overview

## Version History

- **v1.0.0** - Original OTP implementation (single token)
- **v1.1.0** - Added refresh token support (this update)
