import {
  BAHAN_STATUS,
  BAHAN_UNITS,
  ORDER_APPROVAL_STATUSES,
  ORDER_PAYMENT_STATUSES,
  ORDER_SEQUENCE_NAME,
  ORDER_STATUS,
  TESTING_SEQUENCE_NAME,
  TESTING_STATUSES,
  TOOLS_AVAILABILITY,
  TOOLS_CONDITIONS,
  WORKSHEET_NOTE_STATUS,
  WORKSHEET_STATUS,
} from "@tepian-k3/constants";
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgSequence,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";
import {
  createFileUrlColumn,
  createRequiredFileUrlColumn,
  createTable,
  timestamps,
} from "../utils";
import {
  districts,
  employees,
  provinces,
  regencies,
  users,
  villages,
} from "./platform";

export const ToolsConditionEnum = pgEnum("tools_condition", TOOLS_CONDITIONS);

export const orderStatusEnum = pgEnum("order_status", ORDER_STATUS);

export const testingStatusEnum = pgEnum("testing_status", TESTING_STATUSES);

export const approvalStatusEnum = pgEnum(
  "approval_status",
  ORDER_APPROVAL_STATUSES,
);

export const paymentStatusEnum = pgEnum(
  "payment_status",
  ORDER_PAYMENT_STATUSES,
);

export const ToolsAvailabilityEnum = pgEnum(
  "tools_availability",
  TOOLS_AVAILABILITY,
);

export const BahanUnitEnum = pgEnum("bahan_unit", BAHAN_UNITS);

export const BahanStatusEnum = pgEnum("bahan_status", BAHAN_STATUS);

export const worksheetStatusEnum = pgEnum("worksheet_status", WORKSHEET_STATUS);

export const worksheetNoteStatusEnum = pgEnum(
  "worksheet_note_status",
  WORKSHEET_NOTE_STATUS,
);

export const kblis = createTable(
  "kblis",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    name: varchar("name", { length: 250 }).notNull(),
    ...timestamps,
  },
  (table) => [index("kbli_id_idx").using("btree", table.id)],
);

export const userCompanies = createTable(
  "user_companies",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 250 }).notNull(),
    kbliId: uuid("kbli_id")
      .notNull()
      .references(() => kblis.id, { onDelete: "cascade" }),
    address: text("address").notNull(),
    maleWorkers: integer("maleWorkers").notNull().default(0),
    femaleWorkers: integer("femaleWorkers").notNull().default(0),
    healthFacilityAvailable: boolean("healthFacilityAvailable")
      .notNull()
      .default(false),
    provinceId: uuid("provinceId")
      .notNull()
      .references(() => provinces.id, { onDelete: "cascade" }),
    districtId: uuid("districtId")
      .notNull()
      .references(() => districts.id, { onDelete: "cascade" }),
    regencyId: uuid("regencyId")
      .notNull()
      .references(() => regencies.id, { onDelete: "cascade" }),
    villageId: uuid("villageId")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    responsibleTestingPerson: varchar("responsible_testing_person", {
      length: 250,
    }).notNull(),
    responsibleTestingPersonPhone: varchar("responsible_testing_person_phone", {
      length: 50,
    }).notNull(),
    responsibleTestingPersonEmail: varchar("responsible_testing_person_email", {
      length: 250,
    }).notNull(),
    email: varchar("email", { length: 250 }).notNull(),
    wlkpStatus: boolean("wlkp_status").notNull().default(false),
    wlkp: text("wlkp"),
    companyBankName: varchar("company_bank_name", { length: 250 }).notNull(),
    companyBankAccount: varchar("company_bank_account", {
      length: 100,
    }).notNull(),
    companyBankAccountName: varchar("company_bank_account_name", {
      length: 250,
    }).notNull(),
    ...createRequiredFileUrlColumn("companyPicture"),
    ...timestamps,
  },
  (table) => [
    index("user_company_id_idx").using("btree", table.id),
    index("user_company_user_id_idx").using("btree", table.userId),
  ],
);

export const userCompanyTestingLocation = createTable(
  "user_company_testing_locations",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    userCompanyId: uuid("user_company_id")
      .notNull()
      .references(() => userCompanies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    regencyId: uuid("regency_id")
      .notNull()
      .references(() => regencies.id, { onDelete: "cascade" }),
    districtId: uuid("district_id")
      .notNull()
      .references(() => districts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    index("user_company_testing_location_id_idx").using("btree", table.id),
    index("user_company_testing_location_user_company_id_idx").using(
      "btree",
      table.userCompanyId,
    ),
  ],
);

export const toolCodes = createTable(
  "tool_codes",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    code: varchar("code", { length: 256 }).notNull().unique(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("tool_code_id_idx").using("btree", table.id),
    index("tool_code_code_idx").using("btree", table.code),
    index("tool_code_is_active_idx").using("btree", table.isActive),
  ],
);

export const tools = createTable(
  "tools",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    toolCodeId: uuid("tool_code_id")
      .notNull()
      .references(() => toolCodes.id, { onDelete: "cascade" }),
    toolUniqueCode: varchar("tool_unique_code", { length: 256 }).notNull(),
    toolName: varchar("tool_name", { length: 256 }).notNull(),
    function: text("function"),
    location: text("location"),
    shelf: text("shelf"),
    BMNnumber: varchar("bmn_number", { length: 100 }),
    NUPnumber: varchar("nup_number", { length: 100 }),
    brand: varchar("brand", { length: 256 }),
    type: varchar("type", { length: 256 }),
    serialNumber: varchar("serial_number", { length: 256 }),
    originOfAcquisition: text("origin_of_acquisition"),
    acquisitionYear: integer("acquisition_year"),
    correction: text("correction"),
    condition: ToolsConditionEnum("condition").notNull(),
    availability: ToolsAvailabilityEnum("availability").notNull(),
    information: text("information"),
    ...timestamps,
  },
  (table) => [
    index("tool_id_idx").using("btree", table.id),
    index("tool_tool_code_id_idx").using("btree", table.toolCodeId),
    index("tool_tool_unique_code_idx").using("btree", table.toolUniqueCode),
  ],
);

export const toolChecks = createTable(
  "tool_checks",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    checkedBy: uuid("checked_by")
      .notNull()
      .references(() => employees.id, { onDelete: "set null" }),
    checkAlatMenyala: boolean("check_alat_menyala").notNull(),
    checkPenyimpangan: boolean("check_penyimpangan").notNull(),
    checkKelengkapanAlat: boolean("check_kelengkapan_alat").notNull(),
    checkKondisiFisikAlat: boolean("check_kondisi_fisik_alat").notNull(),
    checkConditionResult: ToolsConditionEnum(
      "check_condition_result",
    ).notNull(),
    ...timestamps,
  },
  (table) => [
    index("tool_check_id_idx").using("btree", table.id),
    index("tool_check_tool_id_idx").using("btree", table.toolId),
    index("tool_check_checked_by_idx").using("btree", table.checkedBy),
  ],
);

export const toolCalibrations = createTable(
  "tool_calibrations",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    calibrationDate: timestamp("calibration_date", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    note: text("note"),
    ...timestamps,
  },
  (table) => [
    index("tool_calibration_id_idx").using("btree", table.id),
    index("tool_calibration_tool_id_idx").using("btree", table.toolId),
  ],
);

export const toolCalibrationCertificates = createTable(
  "tool_calibration_certificates",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    toolCalibrationId: uuid("tool_calibration_id")
      .notNull()
      .references(() => toolCalibrations.id, { onDelete: "cascade" }),
    ...createFileUrlColumn("certificateFile"),
    ...timestamps,
  },
  (table) => [
    index("tool_calibration_certificate_id_idx").using("btree", table.id),
    index("tool_calibration_certificate_tool_calibration_id_idx").using(
      "btree",
      table.toolCalibrationId,
    ),
  ],
);

export const toolCalibrationDocumentations = createTable(
  "tool_calibration_documentations",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    toolCalibrationId: uuid("tool_calibration_id")
      .notNull()
      .references(() => toolCalibrations.id, { onDelete: "cascade" }),
    ...createFileUrlColumn("documentationFile"),
    ...timestamps,
  },
  (table) => [
    index("tool_calibration_documentation_id_idx").using("btree", table.id),
    index("tool_calibration_documentation_tool_calibration_id_idx").using(
      "btree",
      table.toolCalibrationId,
    ),
  ],
);

export const clusters = createTable(
  "clusters",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    name: varchar("name", { length: 250 }).notNull().unique(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [
    index("cluster_id_idx").using("btree", table.id),
    index("cluster_name_idx").using("btree", table.name),
  ],
);

export const parameterCategories = createTable(
  "parameter_categories",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    clusterId: uuid("cluster_id")
      .notNull()
      .references(() => clusters.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 250 }).notNull().unique(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [
    index("parameter_category_id_idx").using("btree", table.id),
    index("parameter_category_cluster_id_idx").using("btree", table.clusterId),
    index("parameter_category_name_idx").using("btree", table.name),
  ],
);

export const parameters = createTable(
  "parameters",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    parameterCategoryId: uuid("parameter_category_id")
      .notNull()
      .references(() => parameterCategories.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 250 }).notNull(),
    reference: text("reference"),
    price: integer("price").notNull(),
    unit: varchar("unit", { length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("parameter_id_idx").using("btree", table.id),
    index("parameter_parameter_category_id_idx").using(
      "btree",
      table.parameterCategoryId,
    ),
    index("parameter_name_idx").using("btree", table.name),
  ],
);

export const parameterTools = createTable(
  "parameter_tools",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    parameterId: uuid("parameter_id")
      .notNull()
      .references(() => parameters.id, { onDelete: "cascade" }),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    index("parameter_tool_id_idx").using("btree", table.id),
    index("parameter_tool_parameter_id_idx").using("btree", table.parameterId),
    index("parameter_tool_tool_id_idx").using("btree", table.toolId),
  ],
);

export const chemicalMaterials = createTable(
  "chemical_materials",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    code: varchar("code", { length: 100 }).notNull().unique(),
    catalogNumber: varchar("catalog_number", { length: 100 }),
    chemicalFormula: varchar("chemical_formula", { length: 100 }),
    name: varchar("name", { length: 256 }).notNull(),
    usedStock: real("used_stock").default(0),
    usedStockUnit: BahanUnitEnum("used_stock_unit"),
    sealedStock: real("sealed_stock").default(0),
    sealedStockUnit: BahanUnitEnum("sealed_stock_unit"),
    monthlyUsage: real("monthly_usage"),
    monthlyUsageUnit: BahanUnitEnum("monthly_usage_unit"),
    remainingUsedMaterial: real("remaining_used_material"),
    remainingUsedMaterialUnit: BahanUnitEnum("remaining_used_material_unit"),
    incomingMaterialNote: text("incoming_material_note"),
    expiredDate: timestamp("expired_date", {
      withTimezone: true,
      mode: "string",
    }),
    status: BahanStatusEnum("status").notNull().default("tersedia"),
    ...timestamps,
  },
  (table) => [
    index("chemical_material_id_idx").using("btree", table.id),
    index("chemical_material_code_idx").using("btree", table.code),
    index("chemical_material_name_idx").using("btree", table.name),
  ],
);

export const parameterChemicalMaterials = createTable(
  "parameter_chemical_materials",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    parameterId: uuid("parameter_id")
      .notNull()
      .references(() => parameters.id, { onDelete: "cascade" }),
    chemicalMaterialId: uuid("chemical_material_id")
      .notNull()
      .references(() => chemicalMaterials.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    index("parameter_chemical_material_id_idx").using("btree", table.id),
    index("parameter_chemical_material_parameter_id_idx").using(
      "btree",
      table.parameterId,
    ),
    index("parameter_chemical_material_chemical_material_id_idx").using(
      "btree",
      table.chemicalMaterialId,
    ),
  ],
);

export const cart = createTable(
  "cart",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => userCompanies.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => userCompanyTestingLocation.id, { onDelete: "cascade" }),
    parameterId: uuid("parameter_id")
      .notNull()
      .references(() => parameters.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    price: integer("price").notNull(),
    ...timestamps,
  },
  (table) => [
    index("cart_user_id_idx").using("btree", table.userId),
    index("cart_company_id_idx").using("btree", table.companyId),
    index("cart_location_id_idx").using("btree", table.locationId),
    index("cart_parameter_id_idx").using("btree", table.parameterId),
  ],
);

export const orderNumberSequence = pgSequence(ORDER_SEQUENCE_NAME);

export const testingSequence = pgSequence(TESTING_SEQUENCE_NAME);

export const order = createTable(
  "orders",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => userCompanies.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    totalAmount: integer("total_amount").notNull(),

    // Keep approval/payment status in orders for quick filtering
    approvalStatus: approvalStatusEnum("approval_status")
      .notNull()
      .default("pending"),
    approvalRejectReason: text("approval_reject_reason"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("unpaid"),
    paymentRejectedReason: text("payment_rejected_reason"),

    // Revision tracking
    revisionCount: integer("revision_count").notNull().default(0),
    revisionNotes: text("revision_notes"),

    // Boolean flags
    coverFlightIncluded: boolean("cover_flight_included").default(false),
    coverGroundTransportationIncluded: boolean(
      "cover_ground_transportation_included",
    ).default(false),
    coverLodgingIncluded: boolean("cover_lodging_included").default(false),
    coverAccommodationIncluded: boolean("cover_accommodation_included").default(
      false,
    ),

    // Note from customer for order
    customerNote: text("customer_note"),

    // Key timestamps
    approvedAt: timestamp("approved_at", {
      withTimezone: true,
      mode: "string",
    }),
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "string",
    }),
    cancelledAt: timestamp("cancelled_at", {
      withTimezone: true,
      mode: "string",
    }),

    // Arrival and departure dates for customers verification
    arrivalDate: timestamp("arrival_date", {
      withTimezone: true,
      mode: "string",
    }),
    departureDate: timestamp("departure_date", {
      withTimezone: true,
      mode: "string",
    }),

    ...timestamps,
  },
  (table) => [
    index("order_id_idx").using("btree", table.id),
    index("order_order_number_idx").using("btree", table.orderNumber),
    index("order_user_id_idx").using("btree", table.userId),
    index("order_company_id_idx").using("btree", table.companyId),
    index("order_status_idx").using("btree", table.status),
    index("order_approval_status_idx").using("btree", table.approvalStatus),
    index("order_payment_status_idx").using("btree", table.paymentStatus),
  ],
);

export const orderItem = createTable(
  "order_items",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    parameterId: uuid("parameter_id")
      .notNull()
      .references(() => parameters.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => userCompanyTestingLocation.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    price: integer("price").notNull(),
    subTotal: integer("sub_total").notNull(),
    ...timestamps,
  },
  (table) => [
    index("order_item_id_idx").using("btree", table.id),
    index("order_item_order_id_idx").using("btree", table.orderId),
  ],
);

export const worksheets = createTable(
  "worksheets",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    status: worksheetStatusEnum("status").notNull().default("draft"),
    estimatedAmountOfMembers: integer("estimated_amount_of_members")
      .notNull()
      .default(0),
    estimatedAmountOfDays: integer("estimated_amount_of_days")
      .notNull()
      .default(0),
    startDate: timestamp("start_date", {
      withTimezone: true,
      mode: "string",
    }),
    endDate: timestamp("end_date", {
      withTimezone: true,
      mode: "string",
    }),
    mainSupervisorId: uuid("main_supervisor_id").references(
      () => employees.id,
      {
        onDelete: "set null",
      },
    ),
    accompanyingSupervisorId: uuid("accompanying_supervisor_id").references(
      () => employees.id,
      { onDelete: "set null" },
    ),
    result: text("result"),

    // Boolean flags for included costs in order, to be used in calculation and invoice generation
    coverFlightIncluded: boolean("cover_flight_included").default(false),
    coverGroundTransportationIncluded: boolean(
      "cover_ground_transportation_included",
    ).default(false),
    coverLodgingIncluded: boolean("cover_lodging_included").default(false),
    coverAccommodationIncluded: boolean("cover_accommodation_included").default(
      false,
    ),

    note: text("note"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    isPersonnelDateSet: boolean("is_personnel_date_set")
      .notNull()
      .default(false),
    revisionNotes: text("revision_notes"),
    ...timestamps,
  },
  (table) => [
    index("worksheet_id_idx").using("btree", table.id),
    index("worksheet_order_id_idx").using("btree", table.orderId),
    index("worksheet_status_idx").using("btree", table.status),
    index("worksheet_main_supervisor_id_idx").using(
      "btree",
      table.mainSupervisorId,
    ),
    index("worksheet_accompanying_supervisor_id_idx").using(
      "btree",
      table.accompanyingSupervisorId,
    ),
    index("worksheet_created_by_idx").using("btree", table.createdBy),
  ],
);

export const worksheetItems = createTable(
  "worksheet_items",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    worksheetId: uuid("worksheet_id")
      .notNull()
      .references(() => worksheets.id, { onDelete: "cascade" }),
    parameterId: uuid("parameter_id")
      .notNull()
      .references(() => parameters.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => userCompanyTestingLocation.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    note: text("note"),
    isReady: boolean("is_ready").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("worksheet_item_id_idx").using("btree", table.id),
    index("worksheet_item_worksheet_id_idx").using("btree", table.worksheetId),
    index("worksheet_item_parameter_id_idx").using("btree", table.parameterId),
    index("worksheet_item_location_id_idx").using("btree", table.locationId),
  ],
);

export const worksheetTools = createTable(
  "worksheet_tools",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    worksheetId: uuid("worksheet_id")
      .notNull()
      .references(() => worksheets.id, { onDelete: "cascade" }),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    borrowedBy: uuid("borrowed_by")
      .references(() => employees.id, { onDelete: "set null" })
      .notNull(),
    returnedBy: uuid("returned_by").references(() => employees.id, {
      onDelete: "set null",
    }),
    returnedAt: timestamp("returned_at", {
      withTimezone: true,
      mode: "string",
    }),
    // Check flags filled at return time
    checkAlatMenyala: boolean("check_alat_menyala"),
    checkPenyimpangan: boolean("check_penyimpangan"),
    checkKelengkapanAlat: boolean("check_kelengkapan_alat"),
    checkKondisiFisikAlat: boolean("check_kondisi_fisik_alat"),
    checkConditionResult: ToolsConditionEnum("check_condition_result"),
    ...timestamps,
  },
  (table) => [
    index("worksheet_tool_id_idx").using("btree", table.id),
    index("worksheet_tool_worksheet_id_idx").using("btree", table.worksheetId),
    index("worksheet_tool_tool_id_idx").using("btree", table.toolId),
    index("worksheet_tool_borrowed_by_idx").using("btree", table.borrowedBy),
  ],
);

export const worksheetToolNeeded = createTable(
  "worksheet_tool_needed",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    worksheetId: uuid("worksheet_id")
      .notNull()
      .references(() => worksheets.id, { onDelete: "cascade" }),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    toolNeeded: integer("tool_needed").notNull(),
    ...timestamps,
  },
  (table) => [
    index("worksheet_tool_needed_id_idx").using("btree", table.id),
    index("worksheet_tool_needed_worksheet_id_idx").using(
      "btree",
      table.worksheetId,
    ),
    index("worksheet_tool_needed_tool_id_idx").using("btree", table.toolId),
  ],
);

export const worksheetChemicalMaterials = createTable(
  "worksheet_chemical_materials",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    worksheetId: uuid("worksheet_id")
      .notNull()
      .references(() => worksheets.id, { onDelete: "cascade" }),
    chemicalMaterialId: uuid("chemical_material_id")
      .notNull()
      .references(() => chemicalMaterials.id, { onDelete: "cascade" }),
    required: real("required").notNull().default(0),
    requiredUnit: BahanUnitEnum("required_unit"),
    ...timestamps,
  },
  (table) => [
    index("worksheet_chemical_material_id_idx").using("btree", table.id),
    index("worksheet_chemical_material_worksheet_id_idx").using(
      "btree",
      table.worksheetId,
    ),
    index("worksheet_chemical_material_chemical_material_id_idx").using(
      "btree",
      table.chemicalMaterialId,
    ),
  ],
);

export const worksheetNotes = createTable(
  "worksheet_notes",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    worksheetId: uuid("worksheet_id")
      .notNull()
      .references(() => worksheets.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    severity: worksheetNoteStatusEnum("severity").notNull(),
    ...timestamps,
  },
  (table) => [
    index("worksheet_note_id_idx").using("btree", table.id),
    index("worksheet_note_worksheet_id_idx").using("btree", table.worksheetId),
  ],
);

export const worksheetAssignments = createTable(
  "worksheet_assignments",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    worksheetId: uuid("worksheet_id")
      .notNull()
      .references(() => worksheets.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    index("worksheet_assignment_id_idx").using("btree", table.id),
    index("worksheet_assignment_worksheet_id_idx").using(
      "btree",
      table.worksheetId,
    ),
    index("worksheet_assignment_employee_id_idx").using(
      "btree",
      table.employeeId,
    ),
  ],
);

export const worksheetOperationalCosts = createTable(
  "worksheet_operational_costs",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    worksheetId: uuid("worksheet_id")
      .notNull()
      .references(() => worksheets.id, { onDelete: "cascade" }),
    item: varchar("item", { length: 255 }).notNull(),
    unitCount: integer("unit_count").notNull().default(1),
    days: integer("days").notNull().default(1),
    unitCost: integer("unit_cost"),
    note: text("note"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("worksheet_operational_cost_id_idx").using("btree", table.id),
    index("worksheet_operational_cost_worksheet_id_idx").using(
      "btree",
      table.worksheetId,
    ),
  ],
);

export const orderStatusHistory = createTable(
  "order_status_history",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull(),
    changedBy: uuid("changed_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    note: text("note"),
    ...timestamps,
  },

  (table) => [
    index("order_status_history_id_idx").using("btree", table.id),
    index("order_status_history_order_id_idx").using("btree", table.orderId),
  ],
);

export const testing = createTable(
  "testing",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    testingNumber: varchar("testing_number", { length: 100 })
      .notNull()
      .unique(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    worksheetId: uuid("worksheet_id")
      .notNull()
      .references(() => worksheets.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => userCompanies.id, { onDelete: "cascade" }),
    testingType: uuid("testing_type")
      .notNull()
      .references(() => parameterCategories.id, { onDelete: "cascade" }),
    status: testingStatusEnum("status").notNull().default("start_testing"),
    note: text("note"),
    ...timestamps,
  },
  (table) => [
    index("testing_id_idx").using("btree", table.id),
    index("testing_testing_number_idx").using("btree", table.testingNumber),
    index("testing_testing_type_idx").using("btree", table.testingType),
    index("testing_user_id_idx").using("btree", table.userId),
    index("testing_company_id_idx").using("btree", table.companyId),
  ],
);

export const testingItem = createTable(
  "testing_item",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    testingId: uuid("testing_id")
      .notNull()
      .references(() => testing.id, { onDelete: "cascade" }),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItem.id, { onDelete: "cascade" }),
    parameterId: uuid("parameter_id")
      .notNull()
      .references(() => parameters.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => userCompanyTestingLocation.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    price: integer("price").notNull(),
    subTotal: integer("sub_total").notNull(),
    result: text("result"),
    note: text("note"),
    ...timestamps,
  },
  (table) => [
    index("testing_item_id_idx").using("btree", table.id),
    index("testing_item_testing_id_idx").using("btree", table.testingId),
    index("testing_item_parameter_id_idx").using("btree", table.parameterId),
  ],
);

// ==================== SURVEY KEPUASAN ====================

export const surveyQuestions = createTable(
  "survey_questions",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    questionText: text("question_text").notNull(),
    order: integer("order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("survey_question_id_idx").using("btree", table.id),
    index("survey_question_order_idx").using("btree", table.order),
    index("survey_question_is_active_idx").using("btree", table.isActive),
  ],
);

export const surveyResponses = createTable(
  "survey_responses",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => surveyQuestions.id, { onDelete: "cascade" }),
    questionText: text("question_text").notNull(), // Copied at submission time for historical preservation
    rating: integer("rating").notNull(), // 1-5
    ...timestamps,
  },
  (table) => [
    index("survey_response_id_idx").using("btree", table.id),
    index("survey_response_order_id_idx").using("btree", table.orderId),
    index("survey_response_question_id_idx").using("btree", table.questionId),
    uniqueIndex("survey_response_order_question_unique_idx").on(
      table.orderId,
      table.questionId,
    ),
  ],
);

export const surveyFeedback = createTable(
  "survey_feedback",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    orderId: uuid("order_id")
      .notNull()
      .unique()
      .references(() => order.id, { onDelete: "cascade" }),
    feedback: text("feedback"),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
      mode: "string",
    })
      .$default(() => sql`CURRENT_TIMESTAMP`)
      .notNull(),
    submittedByUserId: uuid("submitted_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    index("survey_feedback_id_idx").using("btree", table.id),
    index("survey_feedback_order_id_idx").using("btree", table.orderId),
  ],
);
