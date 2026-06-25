import type { QueuePreset } from "./types";
import { QueueName } from "./types";

export const queuePresets: Record<QueueName, QueuePreset> = {
  [QueueName.EMAIL]: {
    name: QueueName.EMAIL,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 1000 },
    },
    workerOptions: {
      concurrency: 5,
    },
  },

  [QueueName.PDF]: {
    name: QueueName.PDF,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 500 },
    },
    workerOptions: {
      concurrency: 2,
    },
  },

  [QueueName.AUDIT]: {
    name: QueueName.AUDIT,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 2000 },
    },
    workerOptions: {
      concurrency: 10,
    },
  },

  [QueueName.NOTIFICATION]: {
    name: QueueName.NOTIFICATION,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { count: 300 },
      removeOnFail: { count: 500 },
    },
    workerOptions: {
      concurrency: 5,
    },
  },

  [QueueName.CLEANUP]: {
    name: QueueName.CLEANUP,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
    workerOptions: {
      concurrency: 2,
    },
  },
};
