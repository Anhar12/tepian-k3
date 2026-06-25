import { QueueName, queueService } from "@tepian-k3/services/queue";
import { storageService } from "@tepian-k3/services/storage";
import { logError, logInfo } from "@tepian-k3/services/logger";

export function registerCleanupWorker() {
  queueService.createWorker(QueueName.CLEANUP, async (job) => {
    if (job.name === "delete-file") {
      try {
        await storageService.delete(job.data.key);
        logInfo(
          "cleanupWorker.delete-file",
          `Successfully deleted file: ${job.data.key}`,
        );
      } catch (error) {
        logError(
          "cleanupWorker.delete-file",
          `Failed to delete file: ${job.data.key}`,
          { error },
        );
        throw error; // Re-throw to trigger retry
      }
    }
  });
}
