import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { env } from "../../../env";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
  from?: string;
}

// Create transporter based on your email service
const createTransporter = () => {
  // Option 1: Gmail
  if (env.EMAIL_PROVIDER === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD, // Use App Password for Gmail
      },
    });
  }

  // Option 2: SMTP (Generic - works with most providers)
  if (env.EMAIL_PROVIDER === "smtp") {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT) || 587,
      secure: env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }

  // Option 3: SendGrid SMTP
  if (env.EMAIL_PROVIDER === "sendgrid") {
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      auth: {
        user: "apikey",
        pass: env.SENDGRID_API_KEY,
      },
    });
  }

  // Option 4: Mailgun SMTP
  if (env.EMAIL_PROVIDER === "mailgun") {
    return nodemailer.createTransport({
      host: env.MAILGUN_SMTP_HOST || "smtp.mailgun.org",
      port: 587,
      auth: {
        user: env.MAILGUN_SMTP_USER,
        pass: env.MAILGUN_SMTP_PASSWORD,
      },
    });
  }

  // Option 5: AWS SES
  if (env.EMAIL_PROVIDER === "ses") {
    return nodemailer.createTransport({
      host: `email-smtp.${env.AWS_REGION || "us-east-1"}.amazonaws.com`,
      port: 587,
      secure: false,
      auth: {
        user: env.AWS_SES_SMTP_USER,
        pass: env.AWS_SES_SMTP_PASSWORD,
      },
    });
  }

  // // Option 6: Ethereal (for testing/development)
  // if (env.NODE_ENV === "development") {
  //   return nodemailer.createTransport({
  //     host: "smtp.ethereal.email",
  //     port: 587,
  //     auth: {
  //       user: env.ETHEREAL_USER,
  //       pass: env.ETHEREAL_PASSWORD,
  //     },
  //   });
  // }

  throw new Error(
    "Email provider not configured. Set EMAIL_PROVIDER in environment variables."
  );
};

const transporter = createTransporter();

export const nodemailerProvider = {
  async send(options: SendEmailOptions) {
    try {
      // Render React component to HTML
      const html = await render(options.react);

      // Also render plain text version
      const text = await render(options.react, { plainText: true });

      const info = await transporter.sendMail({
        from: options.from || env.EMAIL_FROM || "noreply@yourdomain.com",
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html,
        text,
      });

      // Log preview URL in development (for Ethereal)
      // if (env.NODE_ENV === "development") {
      //   console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      // }

      return info;
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new Error(
        `Failed to send email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Verify transporter connection
  async verify() {
    try {
      await transporter.verify();
      console.log("Email server is ready to send messages");
      return true;
    } catch (error) {
      console.error("Email server verification failed:", error);
      return false;
    }
  },
};
