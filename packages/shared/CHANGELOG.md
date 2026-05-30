# @tepian-k3/shared

## 1.1.0

### Minor Changes

- feat(api,auth,constants,db,queries,schema,services,shared,types,utils,web): add location columns to order queries (#73)
  - add location columns to order queries (#73)
  - per-resource approval actions + permission/role refinementsFeat/revision 3 (#72)
  - add new journal entry for mushy maddog version 7
  - add sync workflow for mirroring to Coolify repo (#67)

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
