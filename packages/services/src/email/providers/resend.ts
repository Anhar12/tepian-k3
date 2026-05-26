import { Resend } from "resend";
import { SendEmailFailedError } from "../types";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
}

let _client: Resend | null = null;
function getClient() {
  if (!_client) _client = new Resend(process.env.RESEND_API_KEY);
  return _client;
}

export const resendProvider = {
  async send(options: SendEmailOptions) {
    const { data, error } = await getClient().emails.send({
      from: options.from || process.env.EMAIL_FROM || "noreply@yourdomain.com",
      to: options.to,
      subject: options.subject,
      react: options.react,
    });

    if (error) {
      throw new SendEmailFailedError("Failed to send email", error);
    }

    return data;
  },
};
