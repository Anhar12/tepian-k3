# @tepian-k3/server

## 1.4.0

### Minor Changes

- feat(api,server): add X-Data-Source header to cache responses
  - add X-Data-Source header to cache responses

### Patch Changes

- Updated dependencies
  - @tepian-k3/api@1.12.0
d
## 1.3.3

### Patch Changes

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

- Updated dependencies
  - @tepian-k3/services@1.3.0
  - @tepian-k3/queries@1.10.0
  - @tepian-k3/auth@1.2.0
  - @tepian-k3/api@1.11.0
  - @tepian-k3/db@1.9.0

## 1.3.2

### Patch Changes

- Updated dependencies
  - @tepian-k3/queries@1.9.0
  - @tepian-k3/api@1.10.0
  - @tepian-k3/db@1.8.1
  - @tepian-k3/services@1.2.2
  - @tepian-k3/auth@1.1.2

## 1.3.1

### Patch Changes

- Updated dependencies
  - @tepian-k3/queries@1.8.0
  - @tepian-k3/api@1.9.0
  - @tepian-k3/db@1.8.0
  - @tepian-k3/services@1.2.1
  - @tepian-k3/auth@1.1.1

## 1.3.0

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
  - @tepian-k3/services@1.2.0
  - @tepian-k3/queries@1.7.0
  - @tepian-k3/auth@1.1.0
  - @tepian-k3/api@1.8.0
  - @tepian-k3/db@1.7.0

## 1.2.4

### Patch Changes

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

- Updated dependencies
  - @tepian-k3/queries@1.6.0
  - @tepian-k3/api@1.7.0
  - @tepian-k3/db@1.6.0
  - @tepian-k3/services@1.1.4
  - @tepian-k3/auth@1.0.13

## 1.2.3

### Patch Changes

- Updated dependencies
  - @tepian-k3/queries@1.5.0
  - @tepian-k3/api@1.6.0
  - @tepian-k3/db@1.5.0
  - @tepian-k3/services@1.1.3
  - @tepian-k3/auth@1.0.12

## 1.2.2

### Patch Changes

- Updated dependencies
  - @tepian-k3/queries@1.4.0
  - @tepian-k3/api@1.5.0
  - @tepian-k3/db@1.4.0
  - @tepian-k3/services@1.1.2
  - @tepian-k3/auth@1.0.11

## 1.2.1

### Patch Changes

- @tepian-k3/api@1.4.1
- @tepian-k3/db@1.3.1
- @tepian-k3/queries@1.3.2
- @tepian-k3/services@1.1.1
- @tepian-k3/auth@1.0.10

## 1.2.0

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

### Patch Changes

- Updated dependencies
  - @tepian-k3/services@1.1.0
  - @tepian-k3/api@1.4.0
  - @tepian-k3/auth@1.0.9
  - @tepian-k3/queries@1.3.1

## 1.1.3

### Patch Changes

- Updated dependencies
  - @tepian-k3/api@1.3.0
  - @tepian-k3/db@1.3.0
  - @tepian-k3/services@1.0.7
  - @tepian-k3/auth@1.0.8

## 1.1.2

### Patch Changes

- Updated dependencies
  - @tepian-k3/api@1.2.1
  - @tepian-k3/db@1.2.1
  - @tepian-k3/auth@1.0.7
  - @tepian-k3/services@1.0.6

## 1.1.1

### Patch Changes

- Updated dependencies
  - @tepian-k3/api@1.2.0
  - @tepian-k3/db@1.2.0
  - @tepian-k3/auth@1.0.6
  - @tepian-k3/services@1.0.6

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
  - @tepian-k3/api@1.1.0
  - @tepian-k3/db@1.1.0
  - @tepian-k3/services@1.0.5
  - @tepian-k3/auth@1.0.5

## 1.0.5

### Patch Changes

- added company bank details
  - @tepian-k3/api@1.0.4
  - @tepian-k3/auth@1.0.4
  - @tepian-k3/db@1.0.4
  - @tepian-k3/services@1.0.4
