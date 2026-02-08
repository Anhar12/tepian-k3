import { QueueName, queueService } from "@tepian-k3/services/queue";
import { emailService } from "@tepian-k3/services/email";

export function registerEmailWorker() {
  queueService.createWorker(QueueName.EMAIL, async (job) => {
    switch (job.name) {
      case "send-otp":
        // job.data is typed as { email, code, expiresInMinutes }
        await emailService.sendOTP(job.data);
        break;
      case "send-welcome":
        // job.data is typed as { email, name, dashboardUrl }
        await emailService.sendWelcome(
          job.data.email,
          job.data.name,
          job.data.dashboardUrl,
        );
        break;
      case "send-password-reset":
        // job.data is typed as { email, resetLink, expiresInMinutes }
        await emailService.sendPasswordReset(
          job.data.email,
          job.data.resetLink,
          job.data.expiresInMinutes,
        );
        break;
      case "send-verification":
        // job.data is typed as { email, verificationLink }
        break;
      default: {
        const _exhaustive: never = job;
        throw new Error(`Unknown email job: ${_exhaustive}`);
      }
    }
  });
}
