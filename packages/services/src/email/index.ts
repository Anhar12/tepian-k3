// import { nodemailerProvider as emailProvider } from "./providers/nodemailer";
// Or use Resend:
import { resendProvider as emailProvider } from "./providers/resend";

import type { SendEmailOptions } from "./providers/nodemailer";
import { OTPEmail } from "./templates/otp";
import { WelcomeEmail } from "./templates/welcome";
import { PasswordResetEmail } from "./templates/password-reset";

export class EmailService {
  private provider = emailProvider;

  async send(options: SendEmailOptions) {
    return await this.provider.send(options);
  }

  async sendOTP(data: {
    email: string;
    code: string;
    expiresInMinutes: number;
  }) {
    return await this.send({
      to: data.email,
      subject: "Your One-Time Password",
      react: OTPEmail({
        code: data.code,
        expiresInMinutes: data.expiresInMinutes,
      }),
    });
  }

  async sendWelcome(email: string, name?: string, dashboardUrl?: string) {
    return await this.send({
      to: email,
      subject: "Welcome to Our Platform!",
      react: WelcomeEmail({ name, dashboardUrl }),
    });
  }

  async sendPasswordReset(
    email: string,
    resetLink: string,
    expiresInMinutes?: number,
  ) {
    return await this.send({
      to: email,
      subject: "Reset Your Password",
      react: PasswordResetEmail({ resetLink, expiresInMinutes }),
    });
  }

  // Verify email connection (Nodemailer only)
  async verify() {
    if ("verify" in this.provider) {
      return await this.provider.verify;
    }
    return true;
  }
}

export const emailService = new EmailService();
