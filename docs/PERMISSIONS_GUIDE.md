# Permissions Guide

This document is the authoritative reference for the permission system in tepian-k3. It covers what each permission controls, which roles hold it, where it is enforced (API vs UI), and common pitfalls.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Permission Actions](#permission-actions)
3. [Resource Groups](#resource-groups)
4. [Role Definitions](#role-definitions)
5. [Workflow Permission Map](#workflow-permission-map)
6. [Enforcement Points](#enforcement-points)
7. [Critical Rules](#critical-rules)

---

## Core Concepts

A permission is a string in the format `resource.action` — e.g. `orders-approval.approve`.

- **Resources** are defined in `packages/constants/src/resources.ts`
- **Actions** are defined in `packages/constants/src/permissions.ts` (`PERMISSION_ACTION`)
- **Role → Permission mapping** is in `packages/constants/src/roles.ts` (`ROLE_PERMISSIONS`)
- **DB enum** `action` in `packages/db/src/schema/platform.ts` is derived directly from `PERMISSION_ACTION` — adding a new action requires a migration (`pnpm db:generate && pnpm db:migrate`)

Permissions are cached in the JWT payload. On login the resolved set of permissions from all assigned roles is embedded in the token. Re-login is required for permission changes to take effect.

---

## Permission Actions

| Action    | Meaning                                  | Typical Use                                 |
| --------- | ---------------------------------------- | ------------------------------------------- |
| `view`    | Can see the list/index of a resource     | Sidebar visibility, paginated list queries  |
| `read`    | Can open a single record's detail        | Detail page load, `getById` queries         |
| `create`  | Can add new records                      | POST / file upload procedures               |
| `update`  | Can modify existing records (data entry) | PATCH / edit form save                      |
| `delete`  | Can remove records (soft or hard delete) | Delete + restore operations                 |
| `review`  | Can request corrections / revert state   | Admin correction actions, revert-to-pending |
| `verify`  | Can verify or reject at a checkpoint     | Intermediate approver in multi-step flows   |
| `approve` | Can give final approval                  | Final decision-maker (kepala_balai)         |
| `reject`  | Can outright reject / deny               | Reject order, deny payment                  |

> **Note:** `review` ≠ `verify` ≠ `approve`. They map to distinct steps in the approval chain. Using the wrong one will silently block the button for the intended role.

---

## Resource Groups

### Orders

| Resource               | What it covers                                  |
| ---------------------- | ----------------------------------------------- |
| `orders`               | Core order record — create, list, read detail   |
| `orders-approval`      | Approve / reject / review the approval workflow |
| `orders-payment`       | Upload, verify, and reject payment proof        |
| `order-items`          | Individual line items on an order               |
| `order-status-history` | Audit trail of status changes                   |
| `cart`                 | Shopping cart (customer-side only)              |

**Key distinction:** `orders.update` is for general order editing (data correction by admin). `orders-approval.*` is exclusively for the approval workflow actions shown in the order detail page.

---

### Worksheets

| Resource                           | What it covers                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `worksheets`                       | Core worksheet record — create, read, submit for verification                                         |
| `worksheets.update`                | **Exclusively** the "Ajukan Verifikasi" (submit for verification) action. Only `kaji_ulang` has this. |
| `worksheets.verify`                | Verify or request revision on a submitted worksheet                                                   |
| `worksheets.approve`               | Give final approval to a verified worksheet                                                           |
| `worksheets-status`                | Low-level status transitions: `updateStatus`, `complete`, `syncToTesting`                             |
| `worksheets-parameters`            | Parameter rows inside the worksheet                                                                   |
| `worksheet-items`                  | Result value rows (analisa results) — filled by `petugas_laboratorium`                                |
| `worksheet-tools`                  | Tools assigned to the worksheet; borrow / return flow                                                 |
| `worksheet-chemical-materials`     | Chemical materials assigned to the worksheet                                                          |
| `worksheet-notes`                  | Internal notes on the worksheet                                                                       |
| `worksheet-assignments`            | Personnel assignments per worksheet                                                                   |
| `worksheets-personnel-assignments` | Supervisor / personnel date assignments                                                               |
| `worksheets-transaction-details`   | Operational cost rows — filled by `kaji_ulang` and `koordinator_administrasi`                         |

> **Critical:** `worksheets.update` is NOT a general "can edit worksheet" gate. It controls only the submit-for-verification step. Use `worksheet-items.update`, `worksheet-tools.update`, or `worksheet-chemical-materials.update` to gate data-entry fields.

---

### Documents

| Resource                 | What it covers                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `documents`              | General documents — upload payment proof, upload and sign reports                                     |
| `documents-admin`        | Admin documents: surat penawaran, SPK, tagihan — generated and uploaded by `koordinator_administrasi` |
| `documents-spt`          | Surat Perintah Tugas — generated by `tim_penjadwalan`, approved by `kepala_balai`                     |
| `document-signature`     | QR-based document signing                                                                             |
| `document-verifications` | Document verification history                                                                         |

---

### Testing

| Resource       | What it covers                                                |
| -------------- | ------------------------------------------------------------- |
| `testing`      | Testing session — create (from approved order), update status |
| `testing-item` | Individual testing items within a session                     |

---

### Platform / Reference Data

| Resource                                                       | What it covers                          |
| -------------------------------------------------------------- | --------------------------------------- |
| `parameters`                                                   | Lab test parameters                     |
| `parameter-categories`                                         | Parameter category groupings            |
| `clusters`                                                     | Parameter clusters                      |
| `parameter-tool`                                               | Tool–parameter assignments              |
| `parameter-chemical-material`                                  | Chemical material–parameter assignments |
| `tools`                                                        | Tool master data                        |
| `tool-codes`                                                   | Tool code assignments                   |
| `tool-calibrations`                                            | Calibration records                     |
| `tool-checks`                                                  | Tool condition checks                   |
| `tool-certifications`                                          | Tool certification records              |
| `tool-documentations`                                          | Tool documentation attachments          |
| `chemical-materials`                                           | Chemical material master data           |
| `employees`                                                    | Employee records                        |
| `positions`                                                    | Job positions                           |
| `user-company`                                                 | Customer company profiles               |
| `user-company-testing-location`                                | Customer company testing locations      |
| `kbli`                                                         | KBLI classification codes               |
| `provinces`, `regency`, `district`, `village`                  | Geographic reference data               |
| `banners`, `news`                                              | CMS content                             |
| `survey-questions`, `survey-responses`, `survey-feedback`      | Survey system                           |
| `notifications`                                                | In-app notifications                    |
| `audits`, `logs`                                               | System audit trail and logs             |
| `roles`, `permissions`, `role-permissions`, `user-permissions` | RBAC management (super_admin only)      |

---

## Role Definitions

### super_admin

All permissions. Bypass for system administration.

---

### admin

**Purpose:** Back-office administrator. Receives orders, verifies document completeness, forwards to the review chain.

**Can:**

- View and read all orders (`orders.view`, `orders.read`, `orders.update`)
- Request corrections / revert order to pending (`orders-approval.review`, `orders-approval.verify`)
- Manage worksheet notes and review worksheets (read-only view)
- Create and manage documents (`documents.create`, `documents.update`)
- View audit logs and employees

**Cannot:**

- Approve or reject orders — only `kepala_balai` can approve; all coordinators + `kepala_balai` can reject
- Submit worksheets for verification (`worksheets.update` not granted)
- Verify or approve payments (`orders-payment.verify` not granted)

**Key permissions:** `orders-approval.review`, `orders-approval.verify`, `documents.create`, `worksheets-status.update`

---

### employee

**Purpose:** Base-level employee. Minimal read-only access to orient within the system.

**Can:**

- View user list, orders, testing sessions, and documents (read-only)

**Cannot:**

- Modify any data, approve anything, or access worksheets, payments, or documents detail

**Key permissions:** `users.view`, `orders.view`, `testing.view`, `documents.view`

---

### koordinator_pengujian

**Purpose:** Verifies kaji_ulang worksheet results, forwards to koordinator_administrasi. Can reject orders.

**Can:**

- Reject orders (`orders-approval.reject`)
- Read and review worksheets
- Verify worksheet status (`worksheets.verify`, `worksheets.approve`, `worksheets-status.verify`)
- Manage personnel assignments on worksheets
- View tool calibration records

**Cannot:**

- Approve orders (`orders-approval.approve` not granted)
- Submit worksheets for verification (`worksheets.update` not granted — kaji_ulang only)
- Edit operational cost rows (`worksheets-transaction-details.update` not granted)
- Create admin documents (`documents-admin.create` not granted)

**Key permissions:** `orders-approval.reject`, `worksheets.verify`, `worksheets.approve`, `worksheets-personnel-assignments.update`

---

### penyelia

**Purpose:** Supervises the lab testing process and verifies worksheet results produced by `petugas_laboratorium`.

**Can:**

- Review and verify testing sessions and testing items (`testing.verify`, `testing-item.verify`)
- Verify and approve worksheets and worksheet items (`worksheets.verify`, `worksheets.approve`, `worksheet-items.approve`)
- Review and verify documents
- Add worksheet notes

**Cannot:**

- Approve or reject orders
- Submit worksheets for verification (`worksheets.update` not granted)
- Create or manage documents-admin or documents-spt
- Edit operational cost rows

**Key permissions:** `worksheets.verify`, `worksheets.approve`, `worksheet-items.approve`, `testing.verify`

---

### koordinator_administrasi

**Purpose:** Handles surat penawaran, SPK, tagihan, and operational cost details. Can reject orders.

**Can:**

- Reject orders (`orders-approval.reject`)
- Create, update, verify admin documents (`documents-admin.create`, `documents-admin.update`)
- Create and manage SPT documents (`documents-spt.create`)
- View and edit operational costs (`worksheets-transaction-details.update`)
- Verify worksheets (`worksheets.verify`)
- Create and verify document verifications

**Cannot:**

- Approve orders (`orders-approval.approve` not granted)
- Submit worksheets for verification (`worksheets.update` not granted)
- Edit worksheet items or tools directly (no `worksheet-items.update`, no `worksheet-tools.update`)

**Key permissions:** `orders-approval.reject`, `documents-admin.create`, `worksheets-transaction-details.update`, `documents-spt.create`

---

### koordinator_mutu

**Purpose:** Quality assurance. Reviews testing process, verifies documents, approves quality outcomes. Can reject orders.

**Can:**

- Reject orders (`orders-approval.reject`)
- Review, verify, and approve worksheets and worksheet items
- Approve documents (`documents.approve`)
- Review and verify document verifications
- View audit logs

**Cannot:**

- Approve orders
- Submit worksheets for verification
- Edit operational costs

**Key permissions:** `orders-approval.reject`, `worksheets.approve`, `documents.approve`, `document-verifications.verify`

---

### kepala_balai

**Purpose:** Final authority. Approves orders, approves and verifies worksheets, approves all document types.

**Can:**

- Approve orders (`orders-approval.approve`)
- Reject orders (`orders-approval.reject`)
- Verify and approve worksheets (`worksheets.verify`, `worksheets.approve`)
- Approve admin documents, SPT (`documents-admin.approve`, `documents-spt.approve`)
- View operational costs (read-only: `worksheets-transaction-details.view`, `.read`)
- View audit logs and system logs

**Cannot:**

- Submit worksheets for verification
- Create admin documents or SPT (no `.create` on `documents-admin` or `documents-spt`)
- Upload surat penawaran (`documents.create` not granted — UI hides this section)
- Edit operational cost rows (`worksheets-transaction-details.update` not granted)
- Verify or approve payments (`orders-payment.verify` not granted)

**Key permissions:** `orders-approval.approve`, `orders-approval.reject`, `worksheets.verify`, `worksheets.approve`, `worksheets-status.approve`

---

### kaji_ulang

**Purpose:** Fills the worksheet — tools, chemical materials, estimates, personnel — and submits for verification.

**Can:**

- Create worksheets from approved orders (`worksheets.create`)
- **Submit worksheet for verification** (`worksheets.update` — exclusive to this role)
- Update worksheet items, tools, chemical materials
- Create and update operational cost estimates (`worksheets-transaction-details.update`)
- Add worksheet notes
- Has `worksheets.verify` to read verification state — but this role does not perform the verification decision

**Cannot:**

- Approve or reject orders
- Be the verifier or approver in the worksheet decision chain (no `worksheets.approve`)
- Create admin documents

**Key permissions:** `worksheets.create`, `worksheets.update` (submit), `worksheet-items.update`, `worksheet-tools.update`, `worksheet-chemical-materials.update`, `worksheets-transaction-details.update`

---

### petugas_laboratorium

**Purpose:** Performs lab testing, enters analisa results into worksheet items.

**Can:**

- Update testing records (`testing.update`)
- Update worksheet items (analisa results: `worksheet-items.update`)
- Update worksheet parameters
- Add worksheet notes
- Create documents

**Cannot:**

- Approve or reject orders
- Submit worksheets for verification
- Edit operational costs

**Key permissions:** `worksheet-items.update`, `worksheets-parameters.update`, `testing.update`

---

### petugas_sampling

**Purpose:** Receives SPT, manages tools at sampling location.

**Can:**

- Update worksheet tool status (`worksheet-tools.update`, `worksheet-tools.verify`)
- Update worksheet assignments
- Update worksheets-status
- Add worksheet notes

**Cannot:**

- Edit worksheet items or chemical materials
- Approve or reject orders

**Key permissions:** `worksheet-tools.update`, `worksheet-tools.verify`, `worksheet-assignments.update`

---

### tim_penjadwalan

**Purpose:** Schedules testing, assigns personnel, generates SPT.

**Can:**

- Create testing sessions (`testing.create`, `testing-item.create`)
- Create and update SPT documents (`documents-spt.create`, `documents-spt.update`)
- Manage personnel assignments on worksheets
- Add worksheet notes

**Cannot:**

- Approve or reject orders
- Submit worksheets for verification
- Edit worksheet items or operational costs

**Key permissions:** `testing.create`, `documents-spt.create`, `worksheets-personnel-assignments.update`

---

### tim_peralatan

**Purpose:** Manages tool inventory, calibrations, and handoffs to petugas_sampling.

**Can:**

- Full CRUD on `worksheet-tools` including `approve`
- Manage tool calibrations, checks, certifications, documentations
- Add worksheet notes

**Cannot:**

- Access orders, worksheets main content, or documents

**Key permissions:** `worksheet-tools.approve`, `tool-calibrations.update`, `tool-checks.create`

---

### bendahara

**Purpose:** Issues SIMPONI billing codes, validates payments, manages financial documents.

**Can:**

- Verify payments (`orders-payment.verify`)
- Reject payments (`orders-payment.reject`)
- Approve billing (`orders-payment.approve`)
- Create and update financial documents (`documents-admin.create`)
- View and update operational cost details (`worksheets-transaction-details.update`)

**Cannot:**

- Approve or reject orders
- Submit worksheets for verification

**Key permissions:** `orders-payment.verify`, `orders-payment.reject`, `orders-payment.approve`, `worksheets-transaction-details.update`

---

### user (Pengguna Layanan / Customer)

**Purpose:** Customer portal. Creates orders, uploads payment proof, tracks status.

**Key permissions:** `cart.create`, `orders.create`, `orders-payment.create`, `documents.create`, `survey-responses.create`

---

### viewer

**Purpose:** Read-only monitoring. No mutations.

**Key permissions:** All `.view` and `.read` permissions across orders, worksheets, documents. No `.create`, `.update`, `.delete`, `.approve`, `.reject`.

---

### petugas_koding

**Purpose:** Inputs billing codes on orders.

**Key permissions:** `orders.view`, `orders.read`, `order-items.read` (8 permissions total, no mutations)

---

## Workflow Permission Map

### Order Approval Workflow

```
Order Submitted (pending)
        │
        ▼
[Admin reviews documents]          orders-approval.review
        │ request correction ──────► orders-approval.review
        │ revert to pending ────────► orders-approval.review
        │
        ▼
[Admin creates worksheet task for kaji_ulang]
        │ kaji_ulang creates worksheet     worksheets.create
        │ kaji_ulang fills items/tools/materials
        │   worksheet-items.update
        │   worksheet-tools.update
        │   worksheet-chemical-materials.update
        │ kaji_ulang fills parameters
        │   worksheets-parameters.update
        │
        ▼
[If parameters OK → detail-transaksi (penawaran)]
        │ koordinator_administrasi creates penawaran document
        │   documents-admin.create
        │ kaji_ulang edits operational cost estimates
        │   worksheets-transaction-details.update
        │
        ▼
[kaji_ulang submits for verification]   worksheets.update  ← EXCLUSIVE
        │
        ▼
[Coordinators / Penyelia verify worksheet]
        │ verify ────────────────────► worksheets.verify
        │   Roles: koordinator_pengujian, penyelia, koordinator_mutu
        │ request revision ──────────► worksheets.verify (requestRevision procedure)
        │
        ▼
[kepala_balai gives final approval]
        │ approve ───────────────────► worksheets.approve
        │
        ▼
[Coordinators / Kepala Balai can reject order at any point]
        │ reject ───────────────────► orders-approval.reject
        │                             Roles: kepala_balai, koordinator_pengujian,
        │                                    koordinator_administrasi, koordinator_mutu
        │ approve ──────────────────► orders-approval.approve
        │                             Role: kepala_balai ONLY
```

**No role holds both** `orders-approval.approve` **and any non-kepala_balai role.** Admin can only review, never approve.

---

### Worksheet Lifecycle Permissions

```
Order Approved
        │
        ▼
[kaji_ulang] creates worksheet      worksheets.create
        │ fills items/tools/materials
        │   worksheet-items.update
        │   worksheet-tools.update
        │   worksheet-chemical-materials.update
        │   worksheets-transaction-details.update
        │
        ▼
[detail-transaksi page — locked once worksheet status leaves "draft" or "revision"]
        │ isEditable = ["draft", "revision"].includes(worksheet.status)
        │ koordinator_administrasi creates penawaran here
        │   documents-admin.create
        │
        ▼
[kaji_ulang] submits for verification  worksheets.update  ← EXCLUSIVE
        │
        ▼
[koordinator_pengujian / penyelia / koordinator_mutu]
        │ verify ────────────────────► worksheets.verify
        │ request revision ──────────► worksheets.verify (requestRevision procedure)
        │
        ▼
[kepala_balai]
        │ approve ───────────────────► worksheets.approve
        │
        ▼
[petugas_laboratorium] enters results  worksheet-items.update
        │
        ▼
[tim_penjadwalan] completes worksheet  worksheets-status.update
```

---

### Operational Costs (detail-transaksi.tsx)

| UI Element               | Permission Required                     | Roles                                           |
| ------------------------ | --------------------------------------- | ----------------------------------------------- |
| "Tambah Item" button     | `worksheets-transaction-details.update` | kaji_ulang, koordinator_administrasi, bendahara |
| Delete row button        | `worksheets-transaction-details.update` | kaji_ulang, koordinator_administrasi, bendahara |
| "Simpan" button          | `worksheets-transaction-details.update` | kaji_ulang, koordinator_administrasi, bendahara |
| "Cetak Penawaran" button | `documents-admin.create`                | koordinator_administrasi                        |

> **Editability lock:** All inputs in `detail-transaksi.tsx` are gated by `isEditable`, which is `true` only when `worksheet.status` is `"draft"` or `"revision"`. Once the worksheet is submitted for verification (status changes), all fields become read-only regardless of permissions.

> **Do NOT use** `worksheets.update` here. That permission is exclusively for submitting a worksheet for verification.

---

### Payment Workflow

| Action               | Permission               | Role      |
| -------------------- | ------------------------ | --------- |
| Upload payment proof | `orders-payment.create`  | user      |
| Verify payment       | `orders-payment.verify`  | bendahara |
| Reject payment       | `orders-payment.reject`  | bendahara |
| Approve billing      | `orders-payment.approve` | bendahara |

---

### Document Generation

| Document Type   | Generate Permission                                                        | Approve Permission                       |
| --------------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| Surat Penawaran | `documents-admin.create` (koordinator_administrasi)                        | `documents-admin.approve` (kepala_balai) |
| SPK / Tagihan   | `documents-admin.create` (koordinator_administrasi)                        | `documents-admin.approve` (kepala_balai) |
| SPT             | `documents-spt.create` (tim_penjadwalan, koordinator_administrasi)         | `documents-spt.approve` (kepala_balai)   |
| Testing Report  | `documents.create` (petugas_laboratorium, admin, koordinator_administrasi) | —                                        |

---

### Notifications

All roles that interact with the back-office use `notifications.update` for UI notification buttons (mark-read, etc.). The `notifications.create` action is reserved for the API `notifyCustomer` procedure and is **not** assigned to any standard employee role — do not use it as a UI gate for notification buttons.

---

## Enforcement Points

### API Layer — `withPermission()`

Located in `packages/api/src/routers/`. Every tRPC procedure that requires authorization uses `withPermission("resource.action")`. If the user's JWT does not contain the permission, the server returns `FORBIDDEN`.

**Key procedures and their guards:**

| Procedure                      | File                       | Permission                              |
| ------------------------------ | -------------------------- | --------------------------------------- |
| `approveOrder`                 | `order.ts:508`             | `orders-approval.approve`               |
| `rejectOrderApproval`          | `order.ts:558`             | `orders-approval.reject`                |
| `requestApprovalRevision`      | `order.ts:612`             | `orders-approval.review`                |
| `adminRevertRevisionToPending` | `order.ts:666`             | `orders-approval.review`                |
| `verifyPayment`                | `order.ts:736`             | `orders-payment.verify`                 |
| `rejectPayment`                | `order.ts:798`             | `orders-payment.reject`                 |
| `submitForVerification`        | `worksheet.ts:198`         | `worksheets.update`                     |
| `requestRevision`              | `worksheet.ts:214`         | `worksheets.verify`                     |
| `verify` (worksheet)           | `worksheet.ts:231`         | `worksheets.verify`                     |
| `saveOperationalCosts`         | `worksheet.ts:1180`        | `worksheets-transaction-details.update` |
| `saveChemicalMaterials`        | `worksheet.ts:1208`        | `worksheet-chemical-materials.update`   |
| `generateOfferingLetter`       | `generate-document.ts:24`  | `documents-admin.create`                |
| `generateSpkDocument`          | `generate-document.ts:95`  | `documents-admin.create`                |
| `generateAssignmentLetter`     | `generate-document.ts:224` | `documents-spt.create`                  |

### UI Layer — `<PermissionGate permission="...">`

Located in route files under `apps/web/src/routes/(core)/`. The `PermissionGate` component hides or disables UI elements based on `profile.permissions` (the JWT-decoded permission array). It does **not** call the server — it is purely a rendering guard.

**Always pair a `PermissionGate` with the corresponding `withPermission()` guard on the API.** The UI gate prevents confusion; the API guard prevents unauthorized mutations.

**Worksheet edit detection (worksheets/index.tsx):**

The `canEditWorksheet` derived value checks if the user has any of the three primary edit permissions:

```typescript
const canEditWorksheet = useMemo(() => {
  const editPermissions = [
    "worksheet-items.update",
    "worksheet-tools.update",
    "worksheet-chemical-materials.update",
  ];
  return editPermissions.some((p) => profile.permissions.includes(p));
}, [profile.permissions]);
```

The readonly alert shows when either `!isEditable` (wrong status) **or** `!canEditWorksheet` (wrong role).

---

## Critical Rules

1. **`worksheets.update` is not a general edit permission.** It is exclusively the "submit for verification" gate. Only `kaji_ulang` should have it.

2. **`orders-approval.approve` is kepala_balai only.** No coordinator or admin can approve orders. Verify the role list before adding this permission anywhere.

3. **`orders-approval.reject` is multi-role.** `kepala_balai`, `koordinator_pengujian`, `koordinator_administrasi`, and `koordinator_mutu` can all reject.

4. **`notifications.update` is the UI gate for notification interactions.** Do not use `notifications.create` in UI — it is reserved for the `notifyCustomer` API procedure.

5. **Adding a new action to `PERMISSION_ACTION` requires a DB migration.** The PostgreSQL `action` enum is derived from the constant. Run `pnpm db:generate && pnpm db:migrate` after adding any new action value.

6. **`documents-admin.create` gates the "Cetak Penawaran" and SPK/tagihan generation buttons.** Only `koordinator_administrasi` (and `bendahara` for some variants) has this. `kepala_balai` has `.approve` but NOT `.create` — the upload/generate section is hidden from them via `PermissionGate`.

7. **Operational cost buttons use `worksheets-transaction-details.update`, not `worksheets.update`.** Using the wrong gate blocks `koordinator_administrasi` who has `worksheets-transaction-details.update` but not `worksheets.update`.

8. **`orders-payment.verify` gates the verify button; `orders-payment.reject` gates the reject button.** Both are held exclusively by `bendahara`. Do not conflate them with the general `.update` action.

9. **Permission changes take effect after re-login.** Permissions are cached in JWT. Changing role permissions in the DB does not affect currently logged-in sessions until the token expires or the user logs out.

10. **`super_admin` gets all permissions via `getAllPermissions()`.** Never manually list permissions for `super_admin` — keep it using the helper function so new permissions are automatically included.

11. **`detail-transaksi.tsx` locks all inputs once worksheet leaves "draft" or "revision" status.** The `isEditable` flag (`["draft", "revision"].includes(worksheet.status)`) is the primary editability gate — permission checks alone are not sufficient.
