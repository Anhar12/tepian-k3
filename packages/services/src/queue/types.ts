import type { JobsOptions, WorkerOptions } from "bullmq";

export const QueueName = {
  EMAIL: "tepian:email",
  PDF: "tepian:pdf",
  AUDIT: "tepian:audit",
  NOTIFICATION: "tepian:notification",
} as const;

export type QueueName = (typeof QueueName)[keyof typeof QueueName];

export interface QueuePreset {
  name: QueueName;
  defaultJobOptions: JobsOptions;
  workerOptions?: Partial<WorkerOptions>;
}
