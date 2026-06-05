# @tepian-k3/auth

## 1.3.1

### Patch Changes

- Updated dependencies
  - @tepian-k3/services@1.7.0
  - @tepian-k3/queries@1.14.0
  - @tepian-k3/schema@1.13.0
  - @tepian-k3/db@1.14.0

## 1.3.0

### Minor Changes

- feat(api,auth,constants,db,queries,schema,services,shared,types,utils,web): add location columns to order queries (#73)
  - add location columns to order queries (#73)
  - per-resource approval actions + permission/role refinementsFeat/revision 3 (#72)
  - add new journal entry for mushy maddog version 7
  - add sync workflow for mirroring to Coolify repo (#67)

### Patch Changes

- Updated dependencies
  - @tepian-k3/db@1.13.0
  - @tepian-k3/queries@1.13.0
  - @tepian-k3/schema@1.12.0
  - @tepian-k3/services@1.6.0

## 1.2.3

### Patch Changes

- Updated dependencies
  - @tepian-k3/services@1.5.0
  - @tepian-k3/queries@1.12.0
  - @tepian-k3/schema@1.11.0
  - @tepian-k3/db@1.12.0

## 1.2.2

### Patch Changes

- Updated dependencies
  - @tepian-k3/db@1.11.0
  - @tepian-k3/queries@1.11.0
  - @tepian-k3/schema@1.10.0
  - @tepian-k3/services@1.4.1

## 1.2.1

### Patch Changes

- Updated dependencies
  - @tepian-k3/services@1.4.0
  - @tepian-k3/db@1.10.0
  - @tepian-k3/queries@1.10.1
  - @tepian-k3/schema@1.9.1

## 1.2.0

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
  - @tepian-k3/services@1.3.0
  - @tepian-k3/queries@1.10.0
  - @tepian-k3/schema@1.9.0
  - @tepian-k3/db@1.9.0

## 1.1.2

### Patch Changes

- Updated dependencies
  - @tepian-k3/queries@1.9.0
  - @tepian-k3/db@1.8.1
  - @tepian-k3/schema@1.8.1
  - @tepian-k3/services@1.2.2

## 1.1.1

### Patch Changes

- Updated dependencies
  - @tepian-k3/queries@1.8.0
  - @tepian-k3/schema@1.8.0
  - @tepian-k3/db@1.8.0
  - @tepian-k3/services@1.2.1

## 1.1.0

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
  - @tepian-k3/schema@1.7.0
  - @tepian-k3/db@1.7.0

## 1.0.13

### Patch Changes

- Updated dependencies
  - @tepian-k3/queries@1.6.0
  - @tepian-k3/schema@1.6.0
  - @tepian-k3/db@1.6.0
  - @tepian-k3/services@1.1.4

## 1.0.12

### Patch Changes

- Updated dependencies
  - @tepian-k3/queries@1.5.0
  - @tepian-k3/db@1.5.0
  - @tepian-k3/schema@1.5.1
  - @tepian-k3/services@1.1.3

## 1.0.11

### Patch Changes

- Updated dependencies
  - @tepian-k3/queries@1.4.0
  - @tepian-k3/schema@1.5.0
  - @tepian-k3/db@1.4.0
  - @tepian-k3/services@1.1.2

## 1.0.10

### Patch Changes

- @tepian-k3/db@1.3.1
- @tepian-k3/queries@1.3.2
- @tepian-k3/schema@1.4.1
- @tepian-k3/services@1.1.1

## 1.0.9

### Patch Changes

- Updated dependencies
  - @tepian-k3/services@1.1.0
  - @tepian-k3/schema@1.4.0
  - @tepian-k3/queries@1.3.1

## 1.0.8

### Patch Changes

- Updated dependencies
  - @tepian-k3/queries@1.3.0
  - @tepian-k3/schema@1.3.0
  - @tepian-k3/db@1.3.0
  - @tepian-k3/services@1.0.7

## 1.0.7

### Patch Changes

- Updated dependencies
  - @tepian-k3/queries@1.2.1
  - @tepian-k3/schema@1.2.1
  - @tepian-k3/db@1.2.1
  - @tepian-k3/services@1.0.6

## 1.0.6

### Patch Changes

- Updated dependencies
  - @tepian-k3/queries@1.2.0
  - @tepian-k3/schema@1.2.0
  - @tepian-k3/db@1.2.0
  - @tepian-k3/services@1.0.6

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
  - @tepian-k3/queries@1.1.0
  - @tepian-k3/schema@1.1.0
  - @tepian-k3/db@1.1.0
  - @tepian-k3/services@1.0.5
