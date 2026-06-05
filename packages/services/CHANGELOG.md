# @tepian-k3/services

## 1.7.0

### Minor Changes

- feat(orders): add document workflow gates, offering/billing refs, and admin documents card

  ## Summary
  - Extends the worksheet schema with `offeringLetterNumber`, `offeringLetterDate`, `billingCode`, and `billingExpiryDate` so each document generation step can reference the previous one as a prerequisite.
  - Enforces status-based permission gates on document generation (Penawaran → Invoice/SPK → SPT), preventing out-of-order printing with meaningful Bahasa Indonesia error messages.
  - Adds a unified `AdminDocumentsCard` component that consolidates all four document Cetak + Upload actions for back-office order detail, replacing scattered inline buttons.

  ## Changes
  - `packages/db/src/schema/pengujian.ts` + migrations 0006–0008: add `offeringLetterNumber`, `offeringLetterDate`, `billingCode`, `billingExpiryDate` to `worksheets`.
  - `packages/constants/src/order.ts`: add `ORDER_STATUS_FLOW_MILESTONE` map and `resolveOrderStatusFlowIndex()` to resolve granular in-between statuses to their visible timeline milestone.
  - `apps/web/src/components/order-timeline.tsx`: use `resolveOrderStatusFlowIndex()` so the active step renders correctly for statuses not directly listed in the flow (e.g. `kaji_ulang_disetujui`).
  - `packages/api/src/routers/pengujian/generate-document.ts`: tighten permissions from `documents-admin.create` to role-specific ones; add status guards and save offering letter number on generation.
  - `packages/api/src/routers/pengujian/document.ts`: migrate SPT document entity from `worksheet` to `order` for consistency; use `orderQueries.getOrderDocument` for duplicate check.
  - `packages/queries/src/pengujian/order.queries.ts`: add `statuses`/`worksheetStatuses` list filters, `getOrderDocument` helper, and include `changedByUser` in status history.
  - `apps/web/src/routes/(core)/back-office/orders/-components/admin-documents-card.tsx`: new unified document card with per-role Cetak/Upload gating.
  - `apps/web/src/routes/(core)/back-office/orders/-components/publish-invoice-dialog.tsx`: new dialog for Bendahara to publish invoice and set billing code/expiry.
  - `apps/web/src/routes/(core)/worksheets/-components/edit-estimate-dialog.tsx`: new dialog for editing worksheet cost estimates.
  - `apps/web/src/hooks/use-permissions.ts`: new hook exposing the current user's permission set.
  - `packages/services/src/pdf/components/pricing-table.tsx`: fix operational cost display logic.

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.13.0

## 1.6.0

### Minor Changes

- feat(api,auth,constants,db,queries,schema,services,shared,types,utils,web): add location columns to order queries (#73)
  - add location columns to order queries (#73)
  - per-resource approval actions + permission/role refinementsFeat/revision 3 (#72)
  - add new journal entry for mushy maddog version 7
  - add sync workflow for mirroring to Coolify repo (#67)

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.12.0

## 1.5.0

### Minor Changes

- feat(api,auth,constants,db,queries,schema,server,services,types,utils,web): replace Input with NumberInput for numeric fields
  - replace Input with NumberInput for numeric fields
  - add NumberInput component and enhance Clusters and TestingTable
  - add hard delete functionality for various entities
  - add order approval revision and resubmission functionality
  - revamp testing flow UI with operational cost defaults (#57)
  - update employee roles and names to Indonesian equivalents
  - add handling for order rejection and cancellation states
  - add company contact details to order detail view
  - add head of company fields to user companies

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.11.0

## 1.4.1

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.10.0

## 1.4.0

### Minor Changes

- feat(api,db,server,services,web): add rate limiter toggle to environment configuration
  - add rate limiter toggle to environment configuration
  - ensure shared network exists for cloudflared compose
  - enhance deployment script with tunnel support
  - add migration service and update VITE_SERVER_URL handling
  - add purge command and update documentation
  - add Cloudflare Tunnel setup guide and configuration files
  - add Dockerfile and docker-compose for DB tools
  - update Dockerfile and compose for improved deployment
  - update migration command to use pnpm exec
  - update environment configuration and improve build script
  - load environment variables from .env.build file
  - add example environment configuration for build process
  - update Docker setup for migration and build process
  - add deployment scripts and configuration files

## 1.3.0

### Minor Changes

- feat(api,auth,config,constants,db,queries,schema,server,services,types,utils,web): implement return tools feature and update borrowed tools query
  - implement return tools feature and update borrowed tools query
  - add employee dashboard link for authorized users
  - implement check tool functionality and update conditions
  - update tool check process and employee references
  - add tool check management functionality
  - enhance return tools and check tool functionality
  - add tool check functionality and history retrieval
  - add return tools functionality to worksheet
  - add logic for tool condition updates in Check Tool feature
  - implement borrowing and returning tools functionality
  - add employee validation and update borrowing logic
  - invalidate queries on successful SPT upload
  - update menu titles to Indonesian language
  - add tool codes and update tools schema
  - update kode alat table schema in DB
  - update kode alat management feature details
  - reorganize into modular monolith with enforced domain boundaries
  - enhance tool management and return flow in pengujian
  - reorganize package structure into domain modules

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.9.0

## 1.2.2

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.8.0

## 1.2.1

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.7.0

## 1.2.0

### Minor Changes

- feat(api,auth,constants,db,queries,schema,server,services,types,utils,web): add className prop for custom styling
  - add className prop for custom styling
  - add margin class to testing in progress component
  - add employee tools worksheet detail route and functionality
  - enhance tool management and worksheet queries
  - improve location handling in worksheet queries
  - add cache clearing functionality after seeding
  - add employee tools management page and update routes
  - enhance tool assignment logic and queries
  - add standard rate limits and enhance functionality

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.6.0

## 1.1.4

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.5.0

## 1.1.3

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.4.0

## 1.1.2

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.3.0

## 1.1.1

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.2.0

## 1.1.0

### Minor Changes

- feat(api,constants,schema,server,services,web): add invoice generation functionality
  Suggested:
  feat(api,constants,schema,server,services,web): add invoice generation functionality
  - add invoice generation functionality
  - implement assignment letter generation and update dialogs
  - add Generate SPK dialog for order processing
  - reset state on worksheet switch and prevent overwriting unsaved edits
  - implement order status subscription in core layout
  - update commit message generation instructions
  - enhance order and document generation

## 1.0.7

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.1.0

## 1.0.6

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.0.6

## 1.0.5

### Patch Changes

- - Added company bank details to user companies schema and queries
  - Added new entries to the migration journal for reflective Zemo, lovely radioactive man, and wise trauma.
  - Updated userCompanies schema to make company bank fields mandatory.
  - Introduced new fields in worksheets schema for personnel date status and revision notes.
  - Implemented validation for worksheet existence and personnel date status in worksheet queries.
  - Added a new method to revise worksheets and update personnel date set status with appropriate error handling.
  - Updated document generation schemas to reflect changes in company bank details.
  - Modified user company schema to enforce required fields for company bank details.
- Updated dependencies
  - @tepian-k3/constants@1.0.5
