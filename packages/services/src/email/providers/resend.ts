import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
}

export const resendProvider = {
  async send(options: SendEmailOptions) {
    const { data, error } = await resend.emails.send({
      from: options.from || process.env.EMAIL_FROM || "noreply@yourdomain.com",
      to: options.to,
      subject: options.subject,
      react: options.react,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  },
};
