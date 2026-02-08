import type { JobsOptions, WorkerOptions } from "bullmq";

export const QUEUE_PREFIX = "tepian";

export const QueueName = {
  EMAIL: "email",
  PDF: "pdf",
  AUDIT: "audit",
  NOTIFICATION: "notification",
} as const;

export type QueueName = (typeof QueueName)[keyof typeof QueueName];

/**
 * Maps each queue → job name → job data type.
 * Add new job names and their data shapes here.
 */
export interface QueueJobDataMap {
  [QueueName.EMAIL]: {
    "send-otp": {
      email: string;
      code: string;
      expiresInMinutes: number;
    };
    "send-welcome": {
      email: string;
      name: string;
      dashboardUrl: string;
    };
    "send-password-reset": {
      email: string;
      resetLink: string;
      expiresInMinutes: number;
    };
    "send-verification": {
      email: string;
      verificationLink: string;
    };
  };
  [QueueName.PDF]: {
    "generate-invoice": {
      orderId: string;
      templateType: string;
    };
    "generate-offering-letter": {
      orderId: string;
    };
    "generate-certificate": {
      testingId: string;
    };
  };
  [QueueName.AUDIT]: {
    log: {
      entityType: string;
      entityId: string;
      action: string;
      userId: string;
      userEmail: string;
      oldValues?: unknown;
      newValues?: unknown;
      changedFields?: string[];
      description: string;
    };
  };
  [QueueName.NOTIFICATION]: {
    "order-status-update": {
      orderId: string;
      status: string;
      userId: string;
    };
    "testing-progress": {
      testingId: string;
      progress: number;
      userId: string;
    };
  };
}

/** Union of valid job names for a given queue */
export type QueueJobName<Q extends QueueName> = keyof QueueJobDataMap[Q] &
  string;

/** Data type for a specific job in a specific queue */
export type QueueJobData<
  Q extends QueueName,
  J extends QueueJobName<Q> = QueueJobName<Q>,
> = QueueJobDataMap[Q][J];

/** Union of all job data types for a given queue (used for worker processor) */
export type QueueJobDataUnion<Q extends QueueName> =
  QueueJobDataMap[Q][QueueJobName<Q>];

/**
 * Discriminated union of { name, data } pairs for a given queue.
 * Each member links a specific job name to its typed data.
 */
export type QueueJobEntry<Q extends QueueName> = {
  [J in QueueJobName<Q>]: { name: J; data: QueueJobDataMap[Q][J] };
}[QueueJobName<Q>];

export interface QueuePreset {
  name: QueueName;
  defaultJobOptions: JobsOptions;
  workerOptions?: Partial<WorkerOptions>;
}
