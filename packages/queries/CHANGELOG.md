# @tepian-k3/queries

## 1.10.0

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
  - @tepian-k3/services@1.3.0
  - @tepian-k3/schema@1.9.0
  - @tepian-k3/types@1.5.0
  - @tepian-k3/utils@1.2.0
  - @tepian-k3/db@1.9.0

## 1.9.0

### Minor Changes

- feat(api,constants,queries,types,web): implement audit logs feature with detailed views
  - implement audit logs feature with detailed views
  - deduct chemical material stock on worksheet completion

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.8.0
  - @tepian-k3/types@1.4.0
  - @tepian-k3/db@1.8.1
  - @tepian-k3/schema@1.8.1
  - @tepian-k3/services@1.2.2
  - @tepian-k3/utils@1.1.2

## 1.8.0

### Minor Changes

- feat(api,constants,db,queries,schema,web): update permission handling and add order seeding functionality
  - update permission handling and add order seeding functionality
  - enhance role-permission assignment handling
  - update kaji_ulang role permissions and descriptions
  - enhance permission handling in auto form fields
  - add user companies seeding functionality
  - update permission scopes for orders and worksheets
  - update role permissions for worksheet operations
  - implement role-based access control for back-office routes
  - add borrowedBy field to worksheetTools and new migration entry
  - add worksheet tool needed table and update queries
  - enhance document generation permissions and UI
  - add SPT document handling in worksheet routes

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.7.0
  - @tepian-k3/schema@1.8.0
  - @tepian-k3/db@1.8.0
  - @tepian-k3/services@1.2.1
  - @tepian-k3/types@1.3.1
  - @tepian-k3/utils@1.1.1

## 1.7.0

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
  - @tepian-k3/services@1.2.0
  - @tepian-k3/schema@1.7.0
  - @tepian-k3/types@1.3.0
  - @tepian-k3/utils@1.1.0
  - @tepian-k3/db@1.7.0

## 1.6.0

### Minor Changes

- feat(api,auth,constants,db,queries,schema,server,services,types,utils,web): add standard rate limits for additional roles
  - add standard rate limits for additional roles
  - enhance personnel assignment logic and validation
  - add seed users for all roles with production checks
  - add worksheet date columns and update order queries
  - enhance role descriptions and metadata for clarity
  - add display board route and component
  - implement document notification configuration
  - enhance role-based navigation after login
  - add employee profile and worksheets querying
  - add testings and worksheets routes with permissions
  - add SPT functionality and related components
  - update worksheet assignment logic and document queries
  - add upload SPT functionality and dialog
  - add getMyAssignmentDocuments for user assignments
  - add new journal entry for abnormal captain britain
  - add new constants for audit, document, employee, order, notification, testing, tools, and worksheet
  - add permission handling for action buttons
  - update role tiers and permissions for new roles

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.5.0
  - @tepian-k3/schema@1.6.0
  - @tepian-k3/types@1.2.0
  - @tepian-k3/db@1.6.0
  - @tepian-k3/services@1.1.4
  - @tepian-k3/utils@1.0.13

## 1.5.0

### Minor Changes

- feat(api,constants,db,queries,web): add SPT functionality and related components
  - add SPT functionality and related components
  - update worksheet assignment logic and document queries

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.4.0
  - @tepian-k3/db@1.5.0
  - @tepian-k3/schema@1.5.1
  - @tepian-k3/services@1.1.3
  - @tepian-k3/types@1.1.3
  - @tepian-k3/utils@1.0.12

## 1.4.0

### Minor Changes

- feat(api,constants,db,queries,schema,web): add upload SPT functionality and dialog
  - add upload SPT functionality and dialog
  - add getMyAssignmentDocuments for user assignments
  - add new journal entry for abnormal captain britain
  - add new constants for audit, document, employee, order, notification, testing, tools, and worksheet
  - add permission handling for action buttons

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.3.0
  - @tepian-k3/schema@1.5.0
  - @tepian-k3/db@1.4.0
  - @tepian-k3/services@1.1.2
  - @tepian-k3/types@1.1.2
  - @tepian-k3/utils@1.0.11

## 1.3.2

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.2.0
  - @tepian-k3/db@1.3.1
  - @tepian-k3/schema@1.4.1
  - @tepian-k3/services@1.1.1
  - @tepian-k3/types@1.1.1
  - @tepian-k3/utils@1.0.10

## 1.3.1

### Patch Changes

- Updated dependencies
  - @tepian-k3/services@1.1.0
  - @tepian-k3/schema@1.4.0
  - @tepian-k3/utils@1.0.9

## 1.3.0

### Minor Changes

- feat(api,constants,db,queries,schema,types,web): add commit message generation instructions for GitHub Copilot
  - add commit message generation instructions for GitHub Copilot
  - add semver bump recommendation based on conventional commits
  - add script to list affected packages by commit
  - add employee certifications feature
  - add employee certification schemas for creation and update with validation
  - implement employee dashboard and certifications routes with role-based menu integration
  - add JSDoc convention guidelines for functions, components, and hooks in CLAUDE.md
  - enhance "Jadwal diterbitkan" section with navigation to PPS certificates and add new customer view page
  - add implementation guide for scheduled testing, including UI updates and database schema for employee certifications

### Patch Changes

- Updated dependencies
  - @tepian-k3/constants@1.1.0
  - @tepian-k3/schema@1.3.0
  - @tepian-k3/types@1.1.0
  - @tepian-k3/db@1.3.0
  - @tepian-k3/services@1.0.7
  - @tepian-k3/utils@1.0.8

## 1.2.1

### Patch Changes

- Refactor order cover flags from 2 fields to 4 granular fields (coverFlightIncluded, coverGroundTransportationIncluded, coverLodgingIncluded, coverAccommodationIncluded), add customerNote field, update checkout UI and worksheet default costs
- Updated dependencies
  - @tepian-k3/schema@1.2.1
  - @tepian-k3/db@1.2.1
  - @tepian-k3/services@1.0.6
  - @tepian-k3/utils@1.0.7
  - @tepian-k3/types@1.0.7

## 1.2.0

### Minor Changes

- feat(order): add arrival and departure date handling for orders
  - Added `arrivalDate` and `departureDate` to order schema.
  - Added `createArrivalDepartureDate` in order queries.
  - Added validation: arrival date must exist before departure date, and departure cannot be earlier than arrival.
  - Updated event schema timestamps to ISO datetime.
  - Added migration for new order schema version.
  - Invalidate order queries after creating arrival/departure date.

### Patch Changes

- Updated dependencies
  - @tepian-k3/schema@1.2.0
  - @tepian-k3/db@1.2.0
  - @tepian-k3/constants@1.0.6
  - @tepian-k3/services@1.0.6
  - @tepian-k3/utils@1.0.6
  - @tepian-k3/types@1.0.6

## 1.1.0

### Minor Changes

- - Added company bank details to user companies schema and queries
  - Added new entries to the migration journal for reflective Zemo, lovely radioactive man, and wise trauma.
  - Updated userCompanies schema to make company bank fields mandatory.
  - Introduced new fields in worksheets schema for personnel date status and revision notes.
  - Implemented validation for worksheet existence and personnel date status in worksheet queries.
  - Added a new method to revise worksheets and update personnel date set status with appropriate error handling.
  - Updated document generation schemas to reflect changes in company bank details.
  - Modified user company schema to enforce required fields for company bank details.

### Patch Changes

- Updated dependencies
  - @tepian-k3/schema@1.1.0
  - @tepian-k3/db@1.1.0
  - @tepian-k3/constants@1.0.5
  - @tepian-k3/services@1.0.5
  - @tepian-k3/types@1.0.5
  - @tepian-k3/utils@1.0.5
