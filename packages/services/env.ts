import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    // NODE_ENV: z.enum(["development", "production", "test"]),
    BASE_URL: z.url(),
    EMAIL_FROM: z.email(),
    EMAIL_PROVIDER: z.enum([
      "smtp",
      "sendgrid",
      "mailgun",
      "gmail",
      "ses",
      "resend",
    ]),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_SECURE: z.enum(["true", "false"]).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    EMAIL_USER: z.email().optional(),
    EMAIL_PASSWORD: z.string().optional(),
    SENDGRID_API_KEY: z.string().optional(),
    MAILGUN_SMTP_HOST: z.string().optional(),
    MAILGUN_SMTP_USER: z.string().optional(),
    MAILGUN_SMTP_PASSWORD: z.string().optional(),
    AWS_REGION: z.string().optional(),
    AWS_SES_SMTP_USER: z.string().optional(),
    AWS_SES_SMTP_PASSWORD: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    ETHEREAL_USER: z.string().optional(),
    ETHEREAL_PASSWORD: z.string().optional(),
    DASHBOARD_URL: z.string().url().optional(),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: "PUBLIC_",

  client: {},

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: process.env,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
});
