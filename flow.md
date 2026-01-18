## Complete Transaction Workflow (Based on Actual Schema)

### Phase 1: Order Creation & Offering

1. Admin creates order from approved cart
   - Order status: `pending` → `approved`
2. Admin uploads `offering_document` (Offering Letter)
   - Document type: `ORDER`, category: `OFFERING_LETTER`

### Phase 2: Customer Approval

3. Admin uploads `cooperation_agreement_template` (Surat Persetujuan)
4. Customer downloads, signs, and uploads `signed_offering_approval`
5. Order `approvedAt` timestamp is set

### Phase 3: Agreement & Invoice

6. Admin uploads `invoice` + `cooperation_agreement` (Surat Perjanjian Kerjasama)
   - Document types: `ORDER` and `LEGAL`

### Phase 4: Payment

7. Customer uploads:
   - `signed_cooperation_agreement`
   - `proof_of_payment`
8. Admin verifies payment
   - Order status: `approved` → `unpaid` → `paid`

### Phase 5: Testing Creation

9. **Admin creates testing record** (linked to orderId)
   - Generates unique `testingNumber`
   - Links to: `orderId`, `userId`, `companyId`, `testingType` (parameter category)
   - Testing status: `start_testing`
   - No schedule info here - that's in worksheet!

10. **System creates testing items**
    - One `testingItem` per `orderItem`
    - Each testingItem contains:
      - `testingId` (links to testing)
      - `orderItemId` (links to original order item)
      - `parameterId` (which parameter to test)
      - `locationId` (testing location)
      - `quantity`, `price`, `subTotal`
      - `result` (filled later by technician)
      - `note` (optional notes)

### Phase 6: Worksheet Creation & Scheduling

11. **Admin creates worksheet** (linked to testingId)
    - Sets schedule:
      - `startDate` (when testing starts)
      - `endDate` (when testing completes - optional initially)
    - Assigns supervisors:
      - `mainSupervisorId` (employee - main supervisor)
      - `accompanyingSupervisorId` (employee - accompanying supervisor)
    - Worksheet status: `in_progress`
    - `createdBy` (user who created worksheet)

12. **Admin creates worksheet items**
    - For each parameter in testingItems, create `worksheetItem`
    - Each worksheetItem contains:
      - `worksheetId`
      - `parameterId` (from testingItem)
      - `locationId` (testing location)
      - `quantity`
      - `value` (test result value - filled by technician)
      - `note` (optional notes)
      - `isReady` (false initially, true when ready to test)

13. **Admin assigns tools to worksheet**
    - Create `worksheetTools` entries
    - Links required tools to this worksheet
    - Based on `parameterTools` relationships

14. **Admin assigns employees to worksheet**
    - Create `worksheetAssignments` entries
    - Assigns lab technicians/staff who will execute testing
    - `assignedBy` tracks who made the assignment

15. **Admin issues documents**
    - Generate `worksheet_document` (PDF with all worksheet details)
    - Generate `spt_document` (Surat Perintah Tugas - assigns supervisors)
    - Generate `testing_schedule` (confirms dates)
    - Document type: `TESTING`, categories: `WORKSHEET`, `SPT`, `SCHEDULE`
    - Testing status: `start_testing` → `in_progress`

### Phase 7: Testing Execution

16. **Assigned employees access worksheet**
    - View `worksheetItems` to see what needs testing
    - View `worksheetTools` to see required equipment
    - Review testing parameters and methods

17. **Lab technicians perform tests**
    - For each `worksheetItem`:
      - Perform test according to parameter specification
      - Record `value` (test result)
      - Add `note` if needed
      - Mark `isReady` as true when complete
    - Supervisors can add `worksheetNotes` with severity levels
      - Severity: info, warning, critical

18. **Update testing item results**
    - Copy results from `worksheetItems` to `testingItem.result`
    - Both tables store results for different purposes:
      - `worksheetItem.value` - raw test value
      - `testingItem.result` - final formatted result for certificate

19. **Complete worksheet**
    - Set `worksheet.endDate` when all items complete
    - Set `worksheet.status`: `in_progress` → `completed`
    - Set `worksheet.result` (overall summary/conclusion)

20. **Complete testing**
    - Testing status: `in_progress` → `completed`
    - All `testingItems` have results filled

### Phase 8: Certificate & Delivery

21. **Admin generates certificate**
    - Pull data from completed `testingItems`
    - Generate PDF certificate with QR verification
    - Document type: `TESTING`, category: `CERTIFICATE`

22. **Authorized users sign certificate**
    - Digital signature recorded in `documentSignatures`
    - Uses document signing service with JWT

23. **Delivery**
    - Customer receives signed certificate
    - Order status: `paid` → `completed` → `delivered`
    - Testing status remains: `completed`
