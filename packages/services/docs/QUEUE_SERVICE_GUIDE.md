# Queue Service Guide (BullMQ)

Job queue service built on [BullMQ](https://docs.bullmq.io/) for background task processing. Uses Redis DB 2 (separate from rate-limiter on DB 0 and cache on DB 1).

## Setup

### Environment Variables

The queue service uses the existing Redis/Memurai config in `.env`:

```env
MEMURAI_HOST=localhost
MEMURAI_PORT=6379
MEMURAI_PASSWORD=
```

No additional env vars are needed.

### Import

```typescript
import {
  queueService,
  QueueName,
  type QueueJobName,
} from "@tepian-k3/services/queue";
```

## Available Queues

| Queue Name            | Constant                 | Retries | Backoff          | Concurrency |
| --------------------- | ------------------------ | ------- | ---------------- | ----------- |
| `tepian:email`        | `QueueName.EMAIL`        | 3       | Exponential (2s) | 5           |
| `tepian:pdf`          | `QueueName.PDF`          | 2       | Exponential (5s) | 2           |
| `tepian:audit`        | `QueueName.AUDIT`        | 5       | Exponential (1s) | 10          |
| `tepian:notification` | `QueueName.NOTIFICATION` | 3       | Exponential (1s) | 5           |

## Typed Job Names

Each queue has a typed set of valid job names defined in `QueueJobNameMap`. This provides autocomplete and compile-time safety when adding jobs or writing workers.

| Queue          | Valid Job Names                                                        |
| -------------- | ---------------------------------------------------------------------- |
| `EMAIL`        | `send-otp`, `send-welcome`, `send-password-reset`, `send-verification` |
| `PDF`          | `generate-invoice`, `generate-offering-letter`, `generate-certificate` |
| `AUDIT`        | `log`                                                                  |
| `NOTIFICATION` | `order-status-update`, `testing-progress`                              |

To add a new job name, update the `QueueJobNameMap` interface in `packages/services/src/queue/types.ts`:

```typescript
export interface QueueJobNameMap {
  [QueueName.EMAIL]:
    | "send-otp"
    | "send-welcome"
    | "send-password-reset"
    | "send-verification"
    | "send-new-job"; // ← add new job names here
  // ...
}
```

Use the `QueueJobName<Q>` utility type to extract valid job names for a specific queue:

```typescript
type EmailJobs = QueueJobName<typeof QueueName.EMAIL>;
// → "send-otp" | "send-welcome" | "send-password-reset" | "send-verification"
```

## API Reference

### `queueService.addJob<Q>(queueName, jobName, data, opts?)`

Add a job to a queue. The `jobName` parameter is typed per queue — only valid job names from `QueueJobNameMap` are accepted. Returns the BullMQ `Job` instance or `null` if Redis is unavailable.

```typescript
await queueService.addJob(QueueName.EMAIL, "send-otp", {
  email: "user@example.com",
  code: "123456",
  expiresInMinutes: 5,
});
```

Override default options per job:

```typescript
await queueService.addJob(
  QueueName.EMAIL,
  "send-welcome",
  { email: "user@example.com", name: "John" },
  {
    delay: 5000, // Delay 5 seconds before processing
    priority: 1, // Higher priority (lower number = higher priority)
  },
);
```

### `queueService.createWorker<Q>(queueName, processor, opts?)`

Register a worker that processes jobs from a queue. Returns the BullMQ `Worker` instance or `null` if Redis is unavailable.

Cast `job.name` to `QueueJobName<Q>` to get typed job names in your switch statement with exhaustive checking:

```typescript
queueService.createWorker(QueueName.EMAIL, async (job) => {
  const jobName = job.name as QueueJobName<typeof QueueName.EMAIL>;

  switch (jobName) {
    case "send-otp":
      await emailService.sendOTP(job.data);
      break;
    case "send-welcome":
      await emailService.sendWelcome(job.data.email, job.data.name);
      break;
    case "send-password-reset":
      await emailService.sendPasswordReset(job.data);
      break;
    case "send-verification":
      await emailService.sendVerification(job.data);
      break;
    default: {
      const _exhaustive: never = jobName;
      throw new Error(`Unknown email job: ${_exhaustive}`);
    }
  }
});
```

Override worker options:

```typescript
queueService.createWorker(
  QueueName.PDF,
  async (job) => {
    // Heavy PDF generation
    return await generatePdf(job.data);
  },
  { concurrency: 1 }, // Override preset concurrency
);
```

### `queueService.getQueue(name)`

Get or create a raw BullMQ `Queue` instance for advanced usage (e.g., bulk operations, flow producers).

```typescript
const queue = queueService.getQueue(QueueName.AUDIT);
if (queue) {
  await queue.addBulk([
    { name: "log", data: { action: "CREATE", entityId: "1" } },
    { name: "log", data: { action: "UPDATE", entityId: "2" } },
  ]);
}
```

### `queueService.shutdown()`

Gracefully close all queues and workers. Call this during server shutdown.

```typescript
process.on("SIGTERM", async () => {
  await queueService.shutdown();
  process.exit(0);
});
```

## Usage Examples

### Email Queue

**Producer** (in tRPC router):

```typescript
// packages/api/src/routers/auth.ts
import { queueService, QueueName } from "@tepian-k3/services/queue";

export const authRouter = createTRPCRouter({
  sendOtp: publicProcedure.input(z.object({ email: z.email() })).mutation(
    async ({ input }) =>
      await runEffect(
        Effect.gen(function* () {
          const code = generateOtpCode();
          yield* otpQueries.create({ email: input.email, code });

          // Queue email instead of sending synchronously
          await queueService.addJob(QueueName.EMAIL, "send-otp", {
            email: input.email,
            code,
            expiresInMinutes: 5,
          });

          return { success: true };
        }),
      ),
  ),
});
```

**Worker** (in server startup):

```typescript
// apps/server/src/workers/email.worker.ts
import {
  queueService,
  QueueName,
  type QueueJobName,
} from "@tepian-k3/services/queue";
import { emailService } from "@tepian-k3/services/email";

export function registerEmailWorker() {
  queueService.createWorker(QueueName.EMAIL, async (job) => {
    const jobName = job.name as QueueJobName<typeof QueueName.EMAIL>;

    switch (jobName) {
      case "send-otp":
        await emailService.sendOTP(job.data);
        break;
      case "send-welcome":
        await emailService.sendWelcome(
          job.data.email,
          job.data.name,
          job.data.dashboardUrl,
        );
        break;
      case "send-password-reset":
        await emailService.sendPasswordReset(
          job.data.email,
          job.data.resetLink,
          job.data.expiresInMinutes,
        );
        break;
      case "send-verification":
        await emailService.sendVerification(job.data);
        break;
      default: {
        const _exhaustive: never = jobName;
        throw new Error(`Unknown email job: ${_exhaustive}`);
      }
    }
  });
}
```

### Audit Queue

```typescript
// Producer
await queueService.addJob(QueueName.AUDIT, "log", {
  entityType: "user",
  entityId: user.id,
  action: "CREATE",
  userId: ctx.user.id,
  userEmail: ctx.user.email,
  newValues: user,
  description: `Created user ${user.name}`,
});

// Worker
queueService.createWorker(QueueName.AUDIT, async (job) => {
  await auditQueries.createAudit(job.data);
});
```

### PDF Generation Queue

```typescript
// Producer
await queueService.addJob(QueueName.PDF, "generate-invoice", {
  orderId: order.id,
  templateType: "invoice",
});

// Worker
queueService.createWorker(QueueName.PDF, async (job) => {
  const pdf = await pdfService.generateInvoice(job.data.orderId);
  await storageService.upload(pdf, {
    filename: `invoice-${job.data.orderId}.pdf`,
  });
});
```

### Server Integration

Register all workers during server startup:

```typescript
// apps/server/src/index.ts
import { queueService } from "@tepian-k3/services/queue";
import { registerEmailWorker } from "./workers/email.worker";
import { registerAuditWorker } from "./workers/audit.worker";

// Register workers
registerEmailWorker();
registerAuditWorker();

// Graceful shutdown
const shutdown = async () => {
  await queueService.shutdown();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

## Adding a New Queue

To add a new queue, update three places:

1. Add the queue name to `QueueName` in `types.ts`
2. Add its job names to `QueueJobNameMap` in `types.ts`
3. Add a preset config in `presets.ts`

```typescript
// types.ts
export const QueueName = {
  // ...existing
  CUSTOM: "tepian:custom",
} as const;

export interface QueueJobNameMap {
  // ...existing
  [QueueName.CUSTOM]: "process" | "cleanup";
}
```

## Architecture

```
Producer (tRPC router)
  │
  │  queueService.addJob()
  ▼
Redis DB 2 ──── Queue (tepian:email, tepian:pdf, etc.)
  │
  │  Worker polls for jobs
  ▼
Worker (registered at server startup)
  │
  │  Processes job, retries on failure
  ▼
Done (auto-removed based on preset limits)
```

## File Structure

```
packages/services/src/queue/
├── index.ts      # QueueService class + singleton export
├── types.ts      # QueueName enum, QueueJobNameMap, QueuePreset interface
└── presets.ts    # Preset configs per queue
```
