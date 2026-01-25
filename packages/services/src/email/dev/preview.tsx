import { OTPEmail } from "../templates/otp";
import { WelcomeEmail } from "../templates/welcome";
import { PasswordResetEmail } from "../templates/password-reset";
import React from "react";

// Preview OTP Email
export const OTPPreview = () => (
  <OTPEmail code="123456" expiresInMinutes={10} />
);

// Preview Welcome Email
export const WelcomePreview = () => (
  <WelcomeEmail
    name="John Doe"
    dashboardUrl="https://yourdomain.com/dashboard"
  />
);

// Preview Password Reset Email
export const PasswordResetPreview = () => (
  <PasswordResetEmail
    resetLink="https://yourdomain.com/reset-password?token=abc123"
    expiresInMinutes={30}
  />
);
