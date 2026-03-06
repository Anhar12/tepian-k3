# Pengujian Terjadwal — Implementation Guide

This document covers everything needed to complete the **"Jadwal diterbitkan"** section
in `StatusStateTestingInProgress` (`apps/web/src/components/status-state.tsx`).

---

## What the UI Should Show

When an order is in the testing phase, the customer-facing status page shows a
**"Jadwal diterbitkan"** section with:

| Item                                     | Source                                                                   | Status                      |
| ---------------------------------------- | ------------------------------------------------------------------------ | --------------------------- |
| Date range (e.g. "20 – 25 Januari 2025") | `worksheets.startDate` / `endDate`                                       | ✅ Already in query         |
| Surat Perintah Tugas                     | `documents` where `type = "assignment_letter"`                           | ✅ Already in query         |
| Berita Acara                             | `documents` where `type = "testing_report"`                              | ✅ Already in query         |
| Sertifikat kalibrasi alat                | `toolCalibrationCertificates` via `worksheetTools → tool → calibrations` | ⚠️ Relations need extending |
| Sertifikat kompetensi PPS                | `employeeCertifications` via `worksheetAssignments → employee`           | ❌ Table does not exist yet |

---

## Files to Touch (in order)

```
1. packages/db/src/schema.ts                    ← add employeeCertifications table
2. packages/db/src/relations.ts                 ← add relations for new table + extend existing
3. packages/queries/src/order.queries.ts        ← extend getOrderWithDocuments query
4. packages/queries/src/employee-certification.queries.ts   ← new file
5. packages/schema/src/employee-certification.schema.ts     ← new file
6. packages/api/src/routers/employee-certification.ts       ← new file
7. packages/api/src/root.ts                     ← register new router
8. apps/web/src/components/status-state.tsx     ← update UI component
9. apps/web/src/routes/(core)/back-office/employees/  ← back-office upload UI
```

---

## Step 1 — Add `employeeCertifications` Table

**File:** `packages/db/src/schema.ts`

Add after the `employees` table definition:

```typescript
export const employeeCertifications = createTable(
  "employee_certifications",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    certificationName: varchar("certification_name", { length: 250 }).notNull(),
    certificationNumber: varchar("certification_number", { length: 100 }),
    issuedBy: varchar("issued_by", { length: 250 }), // e.g. BNSP, Kemenaker
    issuedAt: timestamp("issued_at", { withTimezone: true, mode: "string" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    ...createFileUrlColumn("certificateFile"),
    ...timestamps,
  },
  (table) => [
    index("employee_certification_id_idx").using("btree", table.id),
    index("employee_certification_employee_id_idx").using(
      "btree",
      table.employeeId,
    ),
  ],
);
```

Then run:

```bash
pnpm db:generate
pnpm db:migrate
```

---

## Step 2 — Update Relations

**File:** `packages/db/src/relations.ts`

### 2a. Add `employeeCertifications` to the import list

```typescript
import {
  // ... existing imports
  employeeCertifications, // add this
} from "./schema";
```

### 2b. Update `employeeRelations` to include certifications

Current:

```typescript
export const employeeRelations = relations(employees, ({ one }) => ({
  user: one(users, ...),
  position: one(positions, ...),
}));
```

Change to:

```typescript
export const employeeRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  position: one(positions, {
    fields: [employees.positionId],
    references: [positions.id],
  }),
  certifications: many(employeeCertifications), // add this
}));
```

### 2c. Add new `employeeCertificationsRelations`

```typescript
export const employeeCertificationsRelations = relations(
  employeeCertifications,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeCertifications.employeeId],
      references: [employees.id],
    }),
  }),
);
```

### 2d. Extend `worksheetToolRelations` to include calibration chain

Current:

```typescript
export const worksheetToolRelations = relations(worksheetTools, ({ one }) => ({
  worksheet: one(worksheets, ...),
  tool: one(tools, ...),
}));
```

The `tool` relation already connects to `toolsRelations → calibrations`. No change needed
here — the nesting is handled at query level (Step 3).

---

## Step 3 — Extend `getOrderWithDocuments` Query

**File:** `packages/queries/src/order.queries.ts`

Do this for **both** `getOrderWithDocuments` and `getOrderWithDocumentsAdmin`.

Change `worksheet: true` to:

```typescript
worksheet: {
  with: {
    assignments: {
      with: {
        employee: {
          with: {
            certifications: true,
          },
        },
      },
    },
    tools: {
      with: {
        tool: {
          with: {
            calibrations: {
              with: {
                certificate: true,
              },
              orderBy: (calibrations, { desc }) => [
                desc(calibrations.calibrationDate),
              ],
              limit: 1, // only the most recent calibration per tool
            },
          },
        },
      },
    },
  },
},
```

> **Note on calibrations relation:** The existing `toolCalibrationsRelations` defines
> `certificate: one(...)` (singular). This means only one certificate file per calibration
> record is returned. If you need multiple certificate files per calibration in the future,
> change it to `certificates: many(toolCalibrationCertificates)` and update the
> `toolCalibrationCertificateRelations` accordingly.

---

## Step 4 — Create Query Functions

**New file:** `packages/queries/src/employee-certification.queries.ts`

```typescript
import { Effect } from "effect";
import { TRPCError } from "@trpc/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@tepian-k3/db/client";
import { employeeCertifications } from "@tepian-k3/db/schema";

export const employeeCertificationQueries = {
  getByEmployeeId: (employeeId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.employeeCertifications.findMany({
          where: and(
            eq(employeeCertifications.employeeId, employeeId),
            isNull(employeeCertifications.deletedAt),
          ),
        }),
      catch: () =>
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil sertifikat kompetensi",
        }),
    }),

  create: (input: {
    employeeId: string;
    certificationName: string;
    certificationNumber?: string;
    issuedBy?: string;
    issuedAt?: string;
    expiresAt?: string;
    certificateFileUrl?: string;
    certificateFileKey?: string;
  }) =>
    Effect.tryPromise({
      try: async () => {
        const [result] = await db
          .insert(employeeCertifications)
          .values(input)
          .returning();
        return result;
      },
      catch: () =>
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menyimpan sertifikat kompetensi",
        }),
    }),

  delete: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const [result] = await db
          .update(employeeCertifications)
          .set({ deletedAt: new Date().toISOString() })
          .where(eq(employeeCertifications.id, id))
          .returning();
        return result;
      },
      catch: () =>
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus sertifikat kompetensi",
        }),
    }),
};
```

---

## Step 5 — Create Zod Schemas

**New file:** `packages/schema/src/employee-certification.schema.ts`

```typescript
import { z } from "zod";

export const createEmployeeCertificationSchema = z.object({
  employeeId: z.string().uuid(),
  certificationName: z.string().min(1, "Nama sertifikasi wajib diisi").max(250),
  certificationNumber: z.string().max(100).optional(),
  issuedBy: z.string().max(250).optional(),
  issuedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const deleteEmployeeCertificationSchema = z.object({
  id: z.string().uuid(),
});
```

Export from `packages/schema/src/index.ts`:

```typescript
export * as employeeCertificationSchema from "./employee-certification.schema";
```

---

## Step 6 — Create tRPC Router

**New file:** `packages/api/src/routers/employee-certification.ts`

```typescript
import { z } from "zod";
import { Effect } from "effect";
import { createTRPCRouter, withPermission, formDataProcedure } from "../trpc";
import { runEffect } from "../utils";
import { employeeCertificationQueries } from "@tepian-k3/queries/employee-certification.queries";
import { employeeCertificationSchema } from "@tepian-k3/schema";
import { storageService } from "@tepian-k3/services/storage";

export const employeeCertificationRouter = createTRPCRouter({
  getByEmployee: withPermission("employees.read")
    .input(z.object({ employeeId: z.string().uuid() }))
    .query(
      async ({ input }) =>
        await runEffect(
          employeeCertificationQueries.getByEmployeeId(input.employeeId),
        ),
    ),

  create: withPermission("employees.update")
    .input(employeeCertificationSchema.createEmployeeCertificationSchema)
    .use(
      formDataProcedure(
        employeeCertificationSchema.createEmployeeCertificationSchema,
      ),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // Upload file if provided
            let fileUrl: string | undefined;
            let fileKey: string | undefined;

            if (ctx.input.data.file) {
              const buffer = Buffer.from(
                await ctx.input.data.file.arrayBuffer(),
              );
              const uploaded = yield* storageService.upload(
                buffer,
                `employee-certifications/${input.employeeId}/${Date.now()}`,
              );
              fileUrl = uploaded.url;
              fileKey = uploaded.key;
            }

            return yield* employeeCertificationQueries.create({
              ...input,
              certificateFileUrl: fileUrl,
              certificateFileKey: fileKey,
            });
          }),
        ),
    ),

  delete: withPermission("employees.update")
    .input(employeeCertificationSchema.deleteEmployeeCertificationSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(employeeCertificationQueries.delete(input.id)),
    ),
});
```

---

## Step 7 — Register Router

**File:** `packages/api/src/root.ts`

```typescript
import { employeeCertificationRouter } from "./routers/employee-certification";

export const appRouter = createTRPCRouter({
  // ... existing routers
  employeeCertification: employeeCertificationRouter,
});
```

---

## Step 8 — Update `StatusStateTestingInProgress` UI

**File:** `apps/web/src/components/status-state.tsx`

The "Jadwal diterbitkan" section shows documents and a **button** that navigates to a
separate page for certificates. It does **not** show certificate files inline.

```tsx
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Link } from "@tanstack/react-router";

// Inside StatusStateTestingInProgress:

const worksheet = orderDetail.worksheet;

// 1. Date range
const dateRange =
  worksheet?.startDate && worksheet?.endDate
    ? `${format(new Date(worksheet.startDate), "d")} - ${format(
        new Date(worksheet.endDate),
        "d MMMM yyyy",
        { locale: id },
      )}`
    : null;

// 2. Surat Perintah Tugas
const assignmentLetterDoc = orderDetail.documents?.find(
  (d) => d.type === "assignment_letter",
);

// 3. Berita Acara
const beritaAcaraDoc = orderDetail.documents?.find(
  (d) => d.type === "testing_report",
);

// 4. Sertifikat kalibrasi alat (one per tool, latest calibration)
const calibrationCerts =
  worksheet?.tools
    ?.map((wt) => wt.tool.calibrations?.[0]?.certificate)
    .filter(Boolean) ?? [];
```

Render (add this block above the arrival/departure form):

```tsx
{
  dateRange && (
    <div className="flex flex-col gap-3">
      <h3 className="font-semibold">Jadwal diterbitkan</h3>

      {/* Date range */}
      <DocumentCard title={dateRange} colorScheme="blue" icon={Calendar} />

      {/* Surat Perintah Tugas */}
      {assignmentLetterDoc && (
        <DocumentCard
          title="Surat Perintah Tugas"
          fileUrl={assignmentLetterDoc.fileUrl}
          colorScheme="blue"
        />
      )}

      {/* Berita Acara */}
      {beritaAcaraDoc && (
        <DocumentCard
          title="Berita Acara"
          fileUrl={beritaAcaraDoc.fileUrl}
          colorScheme="blue"
        />
      )}

      {/* Sertifikat kalibrasi alat */}
      {calibrationCerts.map((cert) => (
        <DocumentCard
          key={cert!.id}
          title="Sertifikat kalibrasi alat"
          fileUrl={cert!.certificateFileUrl ?? undefined}
          colorScheme="blue"
        />
      ))}

      {/* Sertifikat kompetensi PPS — button navigates to a separate page */}
      <Link
        to="/pengujian/sertifikat-pps/$orderId"
        params={{ orderId: orderDetail.id }}
      >
        <Button variant="outline" className="w-full">
          Lihat Sertifikat Kompetensi PPS
        </Button>
      </Link>
    </div>
  );
}
```

---

## Step 9 — New Page: Customer View of PPS Certificates

**New file:** `apps/web/src/routes/(core)/pengujian/sertifikat-pps.$orderId.tsx`

This page is navigated to from the button in Step 8. It shows the list of competency
certificates for all employees assigned to the order's worksheet. It is **read-only**
for the customer — employees manage their own certs from their dashboard (Step 10).

```
Route: /pengujian/sertifikat-pps/$orderId
Access: protectedProcedure (customer who owns the order)
Data: trpc.order.getOrderWithDocuments → worksheet.assignments → employee.certifications
```

Page content:

- Heading: "Sertifikat Kompetensi PPS"
- For each assigned employee: show their name + list their certificates with a download
  link per cert
- If an employee has no certificates yet: show a placeholder

---

## Step 10 — Employee Dashboard: Certificate Management

**New route:** `apps/web/src/routes/(core)/dashboard/sertifikat/`

Employees manage their own competency certificates from their dashboard (similar to how
users manage their companies at `/dashboard/company`).

```
Route: /dashboard/sertifikat
Access: protectedProcedure — only the logged-in employee sees their own certs
Data: trpc.employeeCertification.getByEmployee({ employeeId: ctx.employee.id })
```

Page content:

- List of existing certificates (name, number, issued by, expiry date, download link)
- Upload button → form with: certification name, number, issued by, issued/expiry dates,
  file upload
- Delete button per certificate

> **Note:** The employee must have an `employees` record linked to their `users` account.
> Check `employees.userId` to resolve the employee from the logged-in user context.

---

## Data Flow Summary

```
Customer status page (StatusStateTestingInProgress)
 ├── dateRange          ← worksheet.startDate / endDate
 ├── Surat Perintah Tugas  ← order.documents[type="assignment_letter"]
 ├── Berita Acara          ← order.documents[type="testing_report"]
 ├── Sertifikat kalibrasi  ← worksheet.tools[].tool.calibrations[0].certificate
 └── [Button] → /pengujian/sertifikat-pps/$orderId
                  └── worksheet.assignments[].employee.certifications[]

Employee dashboard (/dashboard/sertifikat)
 └── employee manages their own certifications (CRUD)
```

---

## Implementation Priority

| Priority | Step                                    | Reason                                                 |
| -------- | --------------------------------------- | ------------------------------------------------------ |
| 1        | Step 1 — Schema                         | Blocks everything else                                 |
| 2        | Step 2 — Relations                      | Required for Drizzle nested queries                    |
| 3        | Steps 4–6 — Queries + schemas + router  | Backend API for cert management                        |
| 4        | Step 7 — Register router                | Wire router into app                                   |
| 5        | Step 3 — Extend `getOrderWithDocuments` | So calibration certs flow to status UI                 |
| 6        | Step 8 — Update status UI               | Customer-visible "Jadwal diterbitkan" section + button |
| 7        | Step 9 — PPS certificate list page      | `/pengujian/sertifikat-pps/$orderId`                   |
| 8        | Step 10 — Employee dashboard cert page  | `/dashboard/sertifikat` for self-management            |
