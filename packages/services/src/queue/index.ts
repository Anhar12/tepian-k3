/**
 * Queue service
 * Provides job queue functionality using BullMQ with Redis
 */
import {
  Queue,
  Worker,
  type JobsOptions,
  type WorkerOptions,
  type ConnectionOptions,
} from "bullmq";
import { env } from "../../env";
import { logInfo, logWarn, logError } from "../logger";
import { queuePresets } from "./presets";
import type {
  QueueName,
  QueueJobName,
  QueueJobDataUnion,
  QueueJobDataMap,
  QueueJobEntry,
} from "./types";
import { QUEUE_PREFIX } from "./types";

export { QueueName, QUEUE_PREFIX } from "./types";
export { queuePresets } from "./presets";
export type {
  QueuePreset,
  QueueJobName,
  QueueJobData,
  QueueJobDataMap,
  QueueJobDataUnion,
  QueueJobEntry,
} from "./types";

class QueueService {
  private connection: ConnectionOptions | null = null;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  constructor() {
    this.connection = {
      host: env.MEMURAI_HOST,
      port: Number(env.MEMURAI_PORT),
      password: env.MEMURAI_PASSWORD || undefined,
      db: 2,
      maxRetriesPerRequest: null,
    };
  }

  /**
   * Get or create a queue by name. If a preset exists for the name, its
   * default job options are applied automatically.
   */
  getQueue(name: string): Queue | null {
    if (!this.connection) {
      logWarn("QueueService.getQueue", "Redis not available, queue disabled");
      return null;
    }

    const existing = this.queues.get(name);
    if (existing) return existing;

    const preset = queuePresets[name as QueueName];

    const queue = new Queue(name, {
      connection: this.connection,
      prefix: QUEUE_PREFIX,
      defaultJobOptions: preset?.defaultJobOptions,
    });

    this.queues.set(name, queue);
    logInfo("QueueService.getQueue", `Queue created: ${name}`);
    return queue;
  }

  /**
   * Add a job to a queue. Returns the job instance or null if Redis is
   * unavailable.
   */
  async addJob<Q extends QueueName, J extends QueueJobName<Q>>(
    queueName: Q,
    jobName: J,
    data: QueueJobDataMap[Q][J],
    opts?: JobsOptions,
  ) {
    const queue = this.getQueue(queueName);
    if (!queue) return null;

    try {
      const job = await queue.add(
        jobName,
        data as Record<string, unknown>,
        opts,
      );
      logInfo(
        "QueueService.addJob",
        `Job added: ${jobName} → ${queueName} (${job.id})`,
      );
      return job;
    } catch (error) {
      logError(
        "QueueService.addJob",
        `Failed to add job ${jobName}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Register a worker for a queue. The processor callback receives a
   * discriminated `{ name, data }` object so switching on `name` narrows
   * `data` to the correct type automatically.
   */
  createWorker<Q extends QueueName, TResult = void>(
    queueName: Q,
    processor: (job: QueueJobEntry<Q>) => Promise<TResult>,
    opts?: Partial<WorkerOptions>,
  ): Worker<QueueJobDataUnion<Q>, TResult> | null {
    if (!this.connection) {
      logWarn(
        "QueueService.createWorker",
        "Redis not available, worker disabled",
      );
      return null;
    }

    const preset = queuePresets[queueName as QueueName];

    const worker = new Worker<QueueJobDataUnion<Q>, TResult>(
      queueName,
      async (job) =>
        processor({ name: job.name, data: job.data } as QueueJobEntry<Q>),
      {
        connection: this.connection,
        prefix: QUEUE_PREFIX,
        ...preset?.workerOptions,
        ...opts,
      },
    );

    worker.on("completed", (job) => {
      logInfo(
        "QueueService.Worker",
        `Job completed: ${job.name} (${job.id}) in ${queueName}`,
      );
    });

    worker.on("failed", (job, err) => {
      logError(
        "QueueService.Worker",
        `Job failed: ${job?.name} (${job?.id}) in ${queueName}: ${err.message}`,
      );
    });

    this.workers.set(queueName, worker as unknown as Worker);
    logInfo("QueueService.createWorker", `Worker registered for ${queueName}`);
    return worker;
  }

  /**
   * Gracefully shut down all queues and workers.
   */
  async shutdown(): Promise<void> {
    logInfo("QueueService.shutdown", "Shutting down queues and workers...");

    const workerCloses = Array.from(this.workers.values()).map((w) =>
      w.close(),
    );
    const queueCloses = Array.from(this.queues.values()).map((q) => q.close());

    await Promise.allSettled([...workerCloses, ...queueCloses]);

    this.workers.clear();
    this.queues.clear();

    logInfo("QueueService.shutdown", "All queues and workers shut down");
  }
}

export const queueService = new QueueService();
