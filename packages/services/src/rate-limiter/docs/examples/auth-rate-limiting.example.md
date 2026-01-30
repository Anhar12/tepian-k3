/\*\*

- Authentication Rate Limiting Examples
- Demonstrates how to implement rate limiting for authentication endpoints
  \*/

import { rateLimiters, createRateLimiter } from "@tepian-k3/services/rate-limiter";

/\*\*

- Example 1: Login rate limiting
  \*/
  export async function loginRateLimiting(email: string, ipAddress: string) {
  const loginLimiter = rateLimiters.auth();

// Rate limit by email
const emailResult = await loginLimiter.consume(`login:email:${email}`);

if (!emailResult.allowed) {
throw new Error(
`Too many login attempts for ${email}. Try again in ${Math.ceil(emailResult.resetMs / 60000)} minutes`
);
}

// Also rate limit by IP to prevent attacks across multiple accounts
const ipResult = await loginLimiter.consume(`login:ip:${ipAddress}`);

if (!ipResult.allowed) {
throw new Error(
`Too many login attempts from your IP. Try again in ${Math.ceil(ipResult.resetMs / 60000)} minutes`
);
}

// Proceed with authentication
return { success: true };
}

/\*\*

- Example 2: OTP verification rate limiting
  \*/
  export async function otpVerificationRateLimiting(
  email: string,
  otpCode: string
  ) {
  const otpLimiter = rateLimiters.otp();

const result = await otpLimiter.consume(`otp:verify:${email}`);

if (!result.allowed) {
// Block further attempts
throw new Error(
`Too many OTP verification attempts. Try requesting a new code in ${Math.ceil(result.resetMs / 60000)} minutes`
);
}

// Verify OTP code
// const isValid = await verifyOTP(email, otpCode);

// if (!isValid) {
// // Invalid OTP, but consumed attempt
// throw new Error("Invalid OTP code");
// }

// OTP verified successfully - reset the rate limit
await otpLimiter.reset(`otp:verify:${email}`);

return { success: true };
}

/\*\*

- Example 3: OTP sending rate limiting
  \*/
  export async function otpSendingRateLimiting(email: string, ipAddress: string) {
  const otpSendLimiter = rateLimiters.otp();
  const emailLimiter = rateLimiters.email();

// Limit OTP requests per email
const otpResult = await otpSendLimiter.consume(`otp:send:${email}`);

if (!otpResult.allowed) {
throw new Error(
`Too many OTP requests for ${email}. Try again in ${Math.ceil(otpResult.resetMs / 60000)} minutes`
);
}

// Limit OTP requests per IP
const ipResult = await otpSendLimiter.consume(`otp:send:ip:${ipAddress}`);

if (!ipResult.allowed) {
throw new Error(
`Too many OTP requests from your IP. Try again in ${Math.ceil(ipResult.resetMs / 60000)} minutes`
);
}

// Limit email sending
const emailResult = await emailLimiter.consume(`email:otp:${email}`);

if (!emailResult.allowed) {
throw new Error(
`Email rate limit exceeded. Try again in ${Math.ceil(emailResult.resetMs / 60000)} minutes`
);
}

// Send OTP
// await sendOTPEmail(email, otpCode);

return {
success: true,
attemptsRemaining: otpResult.remaining,
};
}

/\*\*

- Example 4: Password reset rate limiting
  \*/
  export async function passwordResetRateLimiting(
  email: string,
  ipAddress: string
  ) {
  const resetLimiter = rateLimiters.passwordReset();

// Limit by email
const emailResult = await resetLimiter.consume(`password-reset:${email}`);

if (!emailResult.allowed) {
throw new Error(
`Too many password reset requests for ${email}. Try again in ${Math.ceil(emailResult.resetMs / 60000)} minutes`
);
}

// Limit by IP
const ipResult = await resetLimiter.consume(
`password-reset:ip:${ipAddress}`
);

if (!ipResult.allowed) {
throw new Error(
`Too many password reset requests from your IP. Try again in ${Math.ceil(ipResult.resetMs / 60000)} minutes`
);
}

// Send password reset email
// await sendPasswordResetEmail(email, resetToken);

return { success: true };
}

/\*\*

- Example 5: Registration rate limiting
  \*/
  export async function registrationRateLimiting(
  email: string,
  ipAddress: string
  ) {
  const registrationLimiter = createRateLimiter({
  points: 3,
  duration: 3600, // 3 registrations per hour
  blockDuration: 3600,
  strategy: "sliding-window",
  });

// Limit registrations per IP
const ipResult = await registrationLimiter.consume(
`registration:ip:${ipAddress}`
);

if (!ipResult.allowed) {
throw new Error(
`Too many registration attempts from your IP. Try again in ${Math.ceil(ipResult.resetMs / 60000)} minutes`
);
}

// Limit registrations per email (prevent spam)
const emailResult = await registrationLimiter.consume(
`registration:email:${email}`
);

if (!emailResult.allowed) {
throw new Error(
`This email has been used too many times recently. Try again later.`
);
}

// Proceed with registration
return { success: true };
}

/\*\*

- Example 6: Failed login tracking with automatic blocking
  \*/
  export async function failedLoginTracking(
  email: string,
  ipAddress: string,
  loginSuccessful: boolean
  ) {
  const failedLoginLimiter = createRateLimiter({
  points: 5,
  duration: 900, // 5 failed attempts per 15 minutes
  blockDuration: 1800, // Block for 30 minutes
  strategy: "sliding-window",
  });

if (!loginSuccessful) {
// Track failed login
const result = await failedLoginLimiter.consume(
`failed-login:${email}`,
1
);

    if (!result.allowed) {
      // Account temporarily locked
      throw new Error(
        `Account temporarily locked due to too many failed login attempts. Try again in ${Math.ceil(result.resetMs / 60000)} minutes`
      );
    }

    return {
      success: false,
      attemptsRemaining: result.remaining,
      lockoutWarning:
        result.remaining <= 2
          ? `Warning: Only ${result.remaining} attempts remaining before lockout`
          : undefined,
    };

} else {
// Successful login - reset failed attempts
await failedLoginLimiter.reset(`failed-login:${email}`);

    return { success: true };

}
}

/\*\*

- Example 7: Email verification rate limiting
  \*/
  export async function emailVerificationRateLimiting(
  email: string,
  ipAddress: string
  ) {
  const verificationLimiter = createRateLimiter({
  points: 5,
  duration: 3600, // 5 verification emails per hour
  strategy: "sliding-window",
  });

const emailLimiter = rateLimiters.email();

// Limit verification requests
const result = await verificationLimiter.consume(
`email-verification:${email}`
);

if (!result.allowed) {
throw new Error(
`Too many verification emails sent. Try again in ${Math.ceil(result.resetMs / 60000)} minutes`
);
}

// Limit email sending
const emailResult = await emailLimiter.consume(
`email:verification:${email}`
);

if (!emailResult.allowed) {
throw new Error(
`Email rate limit exceeded. Try again in ${Math.ceil(emailResult.resetMs / 60000)} minutes`
);
}

// Send verification email
// await sendVerificationEmail(email, verificationToken);

return {
success: true,
attemptsRemaining: result.remaining,
};
}

/\*\*

- Example 8: Two-factor authentication rate limiting
  \*/
  export async function twoFactorAuthRateLimiting(userId: string, code: string) {
  const twoFactorLimiter = createRateLimiter({
  points: 3,
  duration: 300, // 3 attempts per 5 minutes
  blockDuration: 900, // Block for 15 minutes
  strategy: "sliding-window",
  });

const result = await twoFactorLimiter.consume(`2fa:${userId}`);

if (!result.allowed) {
throw new Error(
`Too many 2FA attempts. Try again in ${Math.ceil(result.resetMs / 60000)} minutes`
);
}

// Verify 2FA code
// const isValid = await verify2FACode(userId, code);

// if (isValid) {
// // Reset on successful verification
// await twoFactorLimiter.reset(`2fa:${userId}`);
// }

return {
success: true,
attemptsRemaining: result.remaining,
};
}

/\*\*

- Example 9: Account enumeration protection
  \*/
  export async function accountEnumerationProtection(
  email: string,
  ipAddress: string
  ) {
  // Use same rate limiter for both existing and non-existing accounts
  // to prevent enumeration attacks
  const enumerationLimiter = createRateLimiter({
  points: 10,
  duration: 300, // 10 attempts per 5 minutes
  blockDuration: 600,
  strategy: "sliding-window",
  });

// Rate limit by IP to prevent scanning
const result = await enumerationLimiter.consume(
`enumeration:ip:${ipAddress}`
);

if (!result.allowed) {
throw new Error(
`Too many requests. Try again in ${Math.ceil(result.resetMs / 60000)} minutes`
);
}

return { allowed: true };
}

/\*\*

- Example 10: Comprehensive auth middleware
  \*/
  export async function comprehensiveAuthRateLimiting(
  action: "login" | "register" | "reset-password" | "verify-email" | "otp",
  email: string,
  ipAddress: string
  ) {
  switch (action) {
  case "login":
  return await loginRateLimiting(email, ipAddress);

      case "register":
        return await registrationRateLimiting(email, ipAddress);

      case "reset-password":
        return await passwordResetRateLimiting(email, ipAddress);

      case "verify-email":
        return await emailVerificationRateLimiting(email, ipAddress);

      case "otp":
        return await otpSendingRateLimiting(email, ipAddress);

      default:
        throw new Error(`Unknown auth action: ${action}`);

  }
  }

/\*\*

- Example 11: Successful login reward
  \*/
  export async function rewardSuccessfulLogin(email: string) {
  const loginLimiter = rateLimiters.auth();

// Reset or reward successful login
await loginLimiter.reset(`login:email:${email}`);

// Optionally, give bonus attempts for good behavior
await loginLimiter.reward(`login:email:${email}`, 1);
}

/\*\*

- Example 12: Admin override
  \*/
  export async function adminUnblockUser(email: string) {
  const loginLimiter = rateLimiters.auth();
  const otpLimiter = rateLimiters.otp();
  const resetLimiter = rateLimiters.passwordReset();

// Clear all rate limits for the user
await Promise.all([
loginLimiter.reset(`login:email:${email}`),
otpLimiter.reset(`otp:send:${email}`),
otpLimiter.reset(`otp:verify:${email}`),
resetLimiter.reset(`password-reset:${email}`),
]);

return { success: true, message: `Rate limits cleared for ${email}` };
}
