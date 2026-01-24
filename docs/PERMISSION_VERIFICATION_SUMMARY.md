# Permission Verification Summary

This document tracks the permission verification status for all back-office and employee routes.

## Permission Actions Available

From `packages/constants/src/permissions.ts`:

- `view` - List/paginated access
- `create` - Create new records
- `read` - Detail/single record access
- `update` - Modify existing records
- `delete` - Remove records
- `review` - Review records
- `verify` - Verify records
- `approve` - Approve records

---

## Route Permission Status

### ✅ Completed Routes

#### `/worksheets/index.tsx` (Employee Area)

| Action | Permission | Status |
|--------|------------|--------|
| Route access | `worksheets.read` | ✅ |
| Save items button | `worksheet-items.update` | ✅ |
| Save tools button | `worksheet-tools.update` | ✅ |
| Save bahan button | `worksheet-chemical-materials.update` | ⚠️ Should be `worksheets.update` (API uses this) |
| Add note button | `worksheet-notes.create` | ✅ |

#### `/worksheets/jadwal-personel.tsx` (Employee Area)

| Action | Permission | Status |
|--------|------------|--------|
| Route access | `worksheets.read` | ✅ |
| Tugaskan Personil button | `worksheet-assignments.update` | ✅ |
| Tugaskan Sekarang button | `worksheet-assignments.update` | ✅ |
| Simpan Penugasan button | `worksheet-assignments.update` | ✅ |
| Edit Penugasan button | `worksheet-assignments.update` | ✅ |

#### `/worksheets/detail-transaksi.tsx` (Employee Area)

| Action | Permission | Status |
|--------|------------|--------|
| Route access | `worksheets.read` | ✅ |
| Tambah Item button | `worksheets.update` | ✅ |
| Delete row button | `worksheets.update` | ✅ |
| Save buttons | `worksheets.update` | ✅ |

#### `/back-office/worksheets/index.tsx`

| Action | Permission | Status |
|--------|------------|--------|
| Route access | `worksheets.view` | ✅ |
| Detail button | `worksheets.view` | ✅ |

#### `/back-office/orders/index.tsx`

| Action | Permission | Status |
|--------|------------|--------|
| Route access | `orders.read` | ✅ |

#### `orders-columns.tsx`

| Action | Permission | Status |
|--------|------------|--------|
| Detail button | `orders.read` | ✅ |

#### `/back-office/testings/index.tsx`

| Action | Permission | Status |
|--------|------------|--------|
| Route access | `testing.view` | ✅ |
| Detail button | `testing.view` | ✅ |

---

### ❌ Routes Needing Updates

#### `/back-office/orders/$orderId.detail.tsx`

| Action | Recommended Permission | Status |
|--------|------------------------|--------|
| Route access | `orders.read` | ✅ |
| Setujui Order button | `orders.approve` | ❌ Missing |
| Tolak Order button | `orders.update` | ❌ Missing |
| Verifikasi Pembayaran button | `orders.verify` | ❌ Missing |
| Tolak Pembayaran button | `orders.update` | ❌ Missing |
| Upload Surat Penawaran | `documents.create` | ❌ Missing |
| Upload Surat Persetujuan | `documents.create` | ❌ Missing |
| Upload Invoice | `documents.create` | ❌ Missing |
| Upload Perjanjian Kerjasama | `documents.create` | ❌ Missing |
| Kirim Dokumen ke Pelanggan button | `notifications.create` | ❌ Missing |
| Buat Testing Record button | `testing.create` | ❌ Missing |
| Buat Worksheet button | `worksheets.create` | ❌ Missing |
| Ajukan Verifikasi button | `worksheets.update` | ❌ Missing |
| Verifikasi Worksheet button | `worksheets.verify` | ❌ Missing |

#### `/back-office/testings/$testingId.detail.tsx`

| Action | Recommended Permission | Status |
|--------|------------------------|--------|
| Route access | `testing.read` | ✅ |
| Update Status dropdown | `testing.update` | ❌ Missing |
| Upload Dokumen button | `documents.create` | ❌ Missing |

---

## Fix Summary

### 1. `/worksheets/index.tsx` - Minor Fix

Change `worksheet-chemical-materials.update` to `worksheets.update` for the save bahan button (line ~1204).

### 2. `/back-office/orders/$orderId.detail.tsx` - Major Updates Needed

Add PermissionGate to the following buttons:

```tsx
// Approval section
<PermissionGate permission="orders.approve">
  <Button onClick={handleApprove}>Setujui Order</Button>
</PermissionGate>

<PermissionGate permission="orders.update">
  <Button onClick={() => dialogs.open("reject")}>Tolak Order</Button>
</PermissionGate>

// Payment verification section
<PermissionGate permission="orders.verify">
  <Button onClick={handleVerifyPayment}>Verifikasi Pembayaran</Button>
</PermissionGate>

<PermissionGate permission="orders.update">
  <Button onClick={() => dialogs.open("rejectPayment")}>Tolak Pembayaran</Button>
</PermissionGate>

// Document upload sections
<PermissionGate permission="documents.create">
  <Button onClick={handleUploadOfferingLetter}>Upload</Button>
</PermissionGate>

// Notify customer
<PermissionGate permission="notifications.create">
  <Button onClick={handleNotifyCustomer}>Kirim Dokumen ke Pelanggan</Button>
</PermissionGate>

// Create testing
<PermissionGate permission="testing.create">
  <Button onClick={handleCreateTesting}>Buat Testing Record</Button>
</PermissionGate>

// Worksheet actions
<PermissionGate permission="worksheets.create">
  <Button onClick={handleCreateWorksheet}>Buat Worksheet</Button>
</PermissionGate>

<PermissionGate permission="worksheets.update">
  <Button onClick={handleSubmitWorksheetForVerification}>Ajukan Verifikasi</Button>
</PermissionGate>

<PermissionGate permission="worksheets.verify">
  <Button onClick={handleVerifyWorksheet}>Verifikasi Worksheet</Button>
</PermissionGate>
```

### 3. `/back-office/testings/$testingId.detail.tsx` - Updates Needed

Add PermissionGate to:

```tsx
// Update status section
<PermissionGate permission="testing.update">
  <Select onValueChange={(value) => updateStatusMutation.mutate(...)}>
    ...
  </Select>
</PermissionGate>

// Document upload
<PermissionGate permission="documents.create">
  <Button onClick={handleUploadDocument}>Unggah</Button>
</PermissionGate>
```

---

## Constants Files Status

### `packages/constants/src/resources.ts` ✅ Complete

All necessary resources are defined.

### `packages/constants/src/permissions.ts` ✅ Complete

All permission actions are defined: `view`, `create`, `read`, `update`, `delete`, `review`, `verify`, `approve`.

---

## Checklist

- [ ] Fix `/worksheets/index.tsx` - change `worksheet-chemical-materials.update` to `worksheets.update`
- [ ] Add PermissionGate to `/back-office/orders/$orderId.detail.tsx` (13 buttons)
- [ ] Add PermissionGate to `/back-office/testings/$testingId.detail.tsx` (2 sections)
- [ ] Run type check after changes
- [ ] Test with different user roles

---

*Generated: 2026-01-21*
