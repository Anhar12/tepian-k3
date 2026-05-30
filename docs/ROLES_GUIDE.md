# Roles Guide

Quick reference for what each role can and cannot do in tepian-k3.

---

## super_admin

All permissions. No restrictions. System administration only.

---

## admin

Back-office administrator. Receives orders, verifies document completeness, forwards to the review chain.

**Can:**

- View and read all orders
- Request corrections on orders and revert order to pending (`orders-approval.review`)
- Create, update, review, and verify documents
- View and review worksheets (read-only)
- Manage worksheet notes
- View audit logs and employees

**Cannot:**

- Approve orders
- Reject orders
- Submit worksheets for verification
- Verify or approve payments
- Create admin documents (penawaran, SPK, tagihan)

---

## employee

Base-level employee. Minimal read-only access.

**Can:**

- View user list, orders, testing sessions, and documents

**Cannot:**

- Modify any data, approve anything, or access worksheets, payments, or document detail

---

## koordinator_pengujian

Verifies kaji_ulang worksheet results, forwards to koordinator_administrasi.

**Can:**

- Reject orders (`orders-approval.reject`)
- Review and verify worksheets (`worksheets.verify`, `worksheets.approve`)
- Manage personnel assignments on worksheets
- Verify worksheet tools and chemical materials
- Add worksheet notes
- View tool calibration records

**Cannot:**

- Approve orders
- Submit worksheets for verification (`worksheets.update` — kaji_ulang only)
- Edit operational cost rows
- Create admin documents

---

## penyelia

Supervises the lab testing process. Verifies worksheet results produced by `petugas_laboratorium`.

**Can:**

- Review and verify testing sessions and testing items (`testing.verify`)
- Verify and approve worksheets and worksheet items (`worksheets.verify`, `worksheets.approve`, `worksheet-items.approve`)
- Review and verify documents
- Add worksheet notes

**Cannot:**

- Approve or reject orders
- Submit worksheets for verification (`worksheets.update` — kaji_ulang only)
- Create or manage admin documents or SPT
- Edit operational cost rows or worksheet tools directly

---

## koordinator_administrasi

Handles surat penawaran, SPK, tagihan, and operational cost details.

**Can:**

- Reject orders (`orders-approval.reject`)
- Create and manage admin documents (penawaran, SPK, tagihan) (`documents-admin.create`)
- Generate and upload SPT documents (`documents-spt.create`)
- Edit operational cost rows (`worksheets-transaction-details.update`)
- Verify worksheets
- Create and verify document verifications

**Cannot:**

- Approve orders
- Submit worksheets for verification
- Edit worksheet items or tools directly
- Approve worksheets

---

## koordinator_mutu

Quality assurance. Reviews testing process, verifies documents, approves quality outcomes.

**Can:**

- Reject orders (`orders-approval.reject`)
- Review, verify, and approve worksheets and worksheet items
- Approve documents (`documents.approve`)
- Verify document verifications
- View audit logs

**Cannot:**

- Approve orders
- Submit worksheets for verification
- Edit operational costs
- Create admin documents

---

## kepala_balai

Final authority. Approves orders and all documents.

**Can:**

- Approve orders (`orders-approval.approve`) — **only role that can**
- Reject orders (`orders-approval.reject`)
- Verify and approve worksheets (`worksheets.verify`, `worksheets.approve`)
- Approve admin documents and SPT
- View operational costs (read-only)
- View audit logs and system logs

**Cannot:**

- Submit worksheets for verification
- Create admin documents or SPT (only approve them)
- Upload surat penawaran (UI section is hidden)
- Edit operational cost rows
- Verify or approve payments

---

## kaji_ulang

Fills the worksheet — tools, chemical materials, estimates, personnel — and submits for verification.

**Can:**

- Create worksheets from approved orders (`worksheets.create`)
- Submit worksheet for verification (`worksheets.update`) — **only role that can**
- Edit worksheet items, tools, and chemical materials
- Create and update operational cost estimates (`worksheets-transaction-details.update`)
- Add worksheet notes
- View tool calibration and certification records
- Has `worksheets.verify` to read verification state — does not act as the decision-maker

**Cannot:**

- Approve or reject orders
- Be the verifier or approver in the worksheet decision chain (no `worksheets.approve`)
- Create admin documents

---

## petugas_laboratorium

Performs lab testing, enters analisa results into worksheet items.

**Can:**

- Update testing records (`testing.update`)
- Enter analisa results into worksheet items (`worksheet-items.update`)
- Update worksheet parameters
- Create and review documents
- Add worksheet notes

**Cannot:**

- Approve or reject orders
- Submit worksheets for verification
- Edit operational costs or tool assignments

---

## petugas_sampling

Receives SPT, manages tool borrowing and returns at sampling location.

**Can:**

- Update worksheet tool status — borrow and verify (`worksheet-tools.update`, `worksheet-tools.verify`)
- Update worksheet assignments
- Update worksheet status
- Add worksheet notes

**Cannot:**

- Edit worksheet items or chemical materials
- Approve or reject orders
- Create any documents

---

## tim_penjadwalan

Schedules testing sessions, assigns personnel, generates SPT.

**Can:**

- Create testing sessions (`testing.create`, `testing-item.create`)
- Create and update SPT documents (`documents-spt.create`)
- Manage personnel assignments on worksheets
- Add worksheet notes

**Cannot:**

- Approve or reject orders
- Submit worksheets for verification
- Edit worksheet items or operational costs

---

## tim_peralatan

Manages tool inventory, calibrations, and handoffs to petugas_sampling.

**Can:**

- Full management of worksheet tools including approve (`worksheet-tools.approve`)
- Manage tool calibrations, checks, certifications, and documentation
- Add worksheet notes

**Cannot:**

- Access orders or core worksheet content
- Approve or reject orders
- Edit worksheet items, parameters, or operational costs

---

## bendahara

Issues SIMPONI billing codes, validates payments, manages financial documents.

**Can:**

- Verify payment proof (`orders-payment.verify`)
- Reject payment proof (`orders-payment.reject`)
- Approve billing (`orders-payment.approve`)
- Create and manage financial admin documents
- View and edit operational cost details (`worksheets-transaction-details.update`)

**Cannot:**

- Approve or reject orders
- Submit worksheets for verification
- Edit worksheet items or tools

---

## user (Pengguna Layanan / Customer)

Customer portal. Creates orders and tracks status.

**Can:**

- Manage their own company profile and testing locations
- Add items to cart and create orders
- Upload payment proof (`orders-payment.create`)
- Upload and view documents
- Submit survey responses

**Cannot:**

- Access any back-office or worksheet functions
- Approve or reject anything
- View other users' orders

---

## petugas_koding

Inputs billing codes on orders. Minimal access.

**Can:**

- View orders and order items (read-only)
- View order status history

**Cannot:**

- Modify any data
- Access worksheets, documents, or payments

---

## viewer

Read-only monitoring. No mutations whatsoever.

**Can:**

- View and read orders, worksheets, documents, user companies, audit logs

**Cannot:**

- Create, update, delete, approve, or reject anything
