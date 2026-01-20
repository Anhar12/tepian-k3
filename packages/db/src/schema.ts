import { desc, sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSequence,
  pgTableCreator,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";
import {
  createFileUrlColumn,
  createRequiredFileUrlColumn,
  timestamps,
} from "./utils";
import {
  AUDIT_ACTIONS,
  DOCUMENT_ENTITY_TYPES,
  DOCUMENT_STATUS,
  DOCUMENT_TYPES,
  EMPLOYEE_STATUS,
  NOTIFICATION_TYPES,
  ORDER_APPROVAL_STATUSES,
  ORDER_PAYMENT_STATUSES,
  ORDER_SEQUENCE_NAME,
  ORDER_STATUS,
  PERMISSION_ACTION,
  TESTING_SEQUENCE_NAME,
  TESTING_STATUSES,
  TOOLS_AVAILABILITY,
  TOOLS_CONDITIONS,
  WORKSHEET_NOTE_STATUS,
  WORKSHEET_STATUS,
  BAHAN_UNITS,
  BAHAN_STATUS,
} from "@tepian-k3/constants";

export const createTable = pgTableCreator((name) => `${name}`);

export const permissionActionEnum = pgEnum("action", PERMISSION_ACTION);

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

export const auditActionEnum = pgEnum("audit_action", AUDIT_ACTIONS);

export const employeeStatusEnum = pgEnum("employee_status", EMPLOYEE_STATUS);

export const worksheetStatusEnum = pgEnum("worksheet_status", WORKSHEET_STATUS);

export const worksheetNoteStatusEnum = pgEnum(
  "worksheet_note_status",
  WORKSHEET_NOTE_STATUS,
);

export const notificationTypeEnum = pgEnum(
  "notification_type",
  NOTIFICATION_TYPES,
);

export const users = createTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    password: varchar("password", { length: 150 }).notNull(),
    email: varchar("email", { length: 250 }).notNull(),
    name: varchar("name", { length: 250 }).notNull(),
    address: text("address").notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at", {
      withTimezone: true,
      mode: "string",
    }),
    ...createFileUrlColumn("profilePicture"),
    ...timestamps,
  },
  (table) => [
    unique("user_email_unique_idx").on(table.email),
    index("user_idx").using("btree", table.id),
    index("user_email_idx").using("btree", table.email),
    uniqueIndex("email_deleted_at_unique_idx")
      .on(table.email)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const documentEntityTypeEnum = pgEnum(
  "document_entity_type",
  DOCUMENT_ENTITY_TYPES,
);

export const documentTypeEnum = pgEnum("document_type", DOCUMENT_TYPES);

export const documentStatusEnum = pgEnum("document_status", DOCUMENT_STATUS);

export const otpCodes = createTable(
  "otp_codes",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    email: varchar("email", { length: 250 }).notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    verified: boolean("verified").notNull().default(false),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .$default(() => sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },

  (table) => [
    index("otp_code_user_id_idx").using("btree", table.userId),
    index("otp_code_email_idx").using("btree", table.email),
  ],
);

export const passwordResets = createTable("password_resets", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .$default(() => uuidv7()),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .$default(() => sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const refreshTokens = createTable(
  "refresh_tokens",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    deviceInfo: text("device_info"),
    os: text("os"),
    version: varchar("version", { length: 100 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "string",
    }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    revoked: boolean("revoked").notNull().default(false),
    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .$default(() => sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("refresh_token_user_id_idx").using("btree", table.userId),
    index("refresh_token_token_idx").using("btree", table.token),
    index("refresh_token_expires_at_idx").using("btree", table.expiresAt),
  ],
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
    wlkp: text("wlkp").notNull(),
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

export const userRoles = createTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", {
      withTimezone: true,
      mode: "string",
    })
      .$default(() => sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.roleId],
    }),
    index("user_role_user_id_idx").using("btree", table.userId),
    index("user_role_role_id_idx").using("btree", table.roleId),
  ],
);

export const roles = createTable(
  "roles",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [index("role_name_idx").using("btree", table.name)],
);

export const permission = createTable(
  "permissions",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    name: text("name").notNull().unique(),
    description: text("description"),
    resource: text("resource").notNull(),
    action: permissionActionEnum("action").notNull(),
    ...timestamps,
  },
  (table) => [
    index("permission_name_resource_action_idx").using(
      "btree",
      table.name,
      table.resource,
      table.action,
    ),
  ],
);

export const rolePermissions = createTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permission.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("role_permission_role_id_idx").using("btree", table.roleId),
    index("role_permission_permission_id_idx").using(
      "btree",
      table.permissionId,
    ),
    primaryKey({
      columns: [table.roleId, table.permissionId],
    }),
  ],
);

export const userPermissions = createTable(
  "user_permissions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permission.id, { onDelete: "cascade" }),
    granted: boolean("granted").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.permissionId] }),
    index("user_permission_user_id_idx").using("btree", table.userId),
    index("user_permission_permission_id_idx").using(
      "btree",
      table.permissionId,
    ),
  ],
);

export const tools = createTable(
  "tools",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    toolCode: varchar("tool_code", { length: 256 }).notNull().unique(),
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
    index("tool_tool_code_idx").using("btree", table.toolCode),
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

export const provinces = createTable(
  "provinces",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    oldId: bigserial("old_id", { mode: "number" }),
    name: varchar("name", { length: 250 }).notNull(),
    ...timestamps,
  },

  (table) => [
    index("province_name_idx").using("btree", table.name),
    index("province_old_id_idx").using("btree", table.oldId),
  ],
);

export const regencies = createTable(
  "regencies",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    oldId: bigserial("old_id", { mode: "number" }),
    provinceId: uuid("province_id")
      .notNull()
      .references(() => provinces.id, { onDelete: "cascade" }),
    oldProvinceId: bigserial("old_province_id", { mode: "number" }),
    name: varchar("name", { length: 250 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("regency_name_idx").using("btree", table.name),
    index("regency_province_id_idx").using("btree", table.provinceId),
    index("regency_old_id_idx").using("btree", table.oldId),
    index("regency_old_province_id_idx").using("btree", table.oldProvinceId),
  ],
);

export const districts = createTable(
  "districts",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    oldId: bigserial("old_id", { mode: "number" }),
    oldRegencyId: bigserial("old_regency_id", { mode: "number" }),
    regencyId: uuid("regency_id")
      .notNull()
      .references(() => regencies.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 250 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("district_name_idx").using("btree", table.name),
    index("district_regency_id_idx").using("btree", table.regencyId),
    index("district_old_id_idx").using("btree", table.oldId),
    index("district_old_regency_id_idx").using("btree", table.oldRegencyId),
  ],
);

export const villages = createTable(
  "villages",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    oldId: bigserial("old_id", { mode: "number" }),
    oldDistrictId: bigserial("old_district_id", { mode: "number" }),
    districtId: uuid("district_id")
      .notNull()
      .references(() => districts.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 250 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("village_name_idx").using("btree", table.name),
    index("village_district_id_idx").using("btree", table.districtId),
    index("village_old_id_idx").using("btree", table.oldId),
    index("village_old_district_id_idx").using("btree", table.oldDistrictId),
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
    coverTransportationIncluded: boolean(
      "cover_transportation_included",
    ).default(false),
    coverAccommodationIncluded: boolean("cover_accommodation_included").default(
      false,
    ),

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

    ...timestamps,
  },
  (table) => [
    index("order_id_idx").using("btree", table.id),
    index("order_order_number_idx").using("btree", table.orderNumber),
    index("order_user_id_idx").using("btree", table.userId),
    index("order_company_id_idx").using("btree", table.companyId),
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
    coverTransportationIncluded: boolean(
      "cover_transportation_included",
    ).default(false),
    coverAccommodationIncluded: boolean("cover_accommodation_included").default(
      false,
    ),
    note: text("note"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
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
    value: real("value"),
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
    ...timestamps,
  },
  (table) => [
    index("worksheet_tool_id_idx").using("btree", table.id),
    index("worksheet_tool_worksheet_id_idx").using("btree", table.worksheetId),
    index("worksheet_tool_tool_id_idx").using("btree", table.toolId),
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

export const audits = createTable(
  "audits",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),

    // What entity was changed
    entityType: text("entity_type").notNull(), // e.g., "order", "order_item", "testing"
    entityId: text("entity_id").notNull(), // ID of the changed entity

    // What action was performed
    action: auditActionEnum("action").notNull(),

    // Who made the change
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    userEmail: text("user_email"), // Stored for historical record even if user deleted

    // What changed
    oldValues: jsonb("old_values"), // Previous state
    newValues: jsonb("new_values"), // New state
    changedFields: jsonb("changed_fields"), // Array of field names that changed

    // Additional context
    metadata: jsonb("metadata"), // Extra info like IP address, user agent, etc.
    description: text("description"), // Human-readable description

    // Timestamps
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_entity_type_id_idx").using(
      "btree",
      table.entityType,
      table.entityId,
    ),
    index("audit_user_id_idx").using("btree", table.userId),
    index("audit_action_idx").using("btree", table.action),
    index("audit_created_at_idx").using("btree", desc(table.createdAt)),
    index("audit_entity_created_idx").using(
      "btree",
      table.entityType,
      table.entityId,
      desc(table.createdAt),
    ),
    index("audits_changed_fields_idx").using("gin", table.changedFields),
  ],
);

export const documents = createTable(
  "documents",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),

    // Document metadata
    documentNumber: varchar("document_number", { length: 100 })
      .notNull()
      .unique(),
    type: documentTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),

    // Polymorphic relationship
    entityType: documentEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(), // Can reference order.id, testing.id, etc.

    // File storage
    fileUrl: text("file_url").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSize: integer("file_size"), // in bytes
    mimeType: varchar("mime_type", { length: 100 }),

    // Digital signature & QR verification
    status: documentStatusEnum("status").notNull().default("draft"),
    signatureData: text("signature_data"), // Cryptographic hash or signature
    qrCodeUrl: text("qr_code_url"), // URL to QR code image
    verificationToken: varchar("verification_token", { length: 255 }).unique(),
    verificationUrl: text("verification_url"), // Full URL: /api/verify-document/{token}

    // User relationships
    uploadedByUserId: uuid("uploaded_by_user_id")
      .notNull()
      .references(() => users.id),
    signedByUserId: uuid("signed_by_user_id").references(() => users.id),

    // Timestamps
    signedAt: timestamp("signed_at", { withTimezone: true, mode: "string" }),
    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
      mode: "string",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),

    ...timestamps,
  },
  (table) => [
    index("documents_id_idx").using("btree", table.id),
    index("documents_entity_idx").using(
      "btree",
      table.entityType,
      table.entityId,
    ),
    index("documents_type_idx").using("btree", table.type),
    index("documents_status_idx").using("btree", table.status),
    index("documents_verification_token_idx").using(
      "btree",
      table.verificationToken,
    ),
    index("documents_document_number_idx").using("btree", table.documentNumber),
  ],
);

export const documentVerifications = createTable(
  "document_verifications",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),

    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    // Verification metadata
    verifiedByUserId: uuid("verified_by_user_id").references(() => users.id),
    verifiedByIp: varchar("verified_by_ip", { length: 45 }), // IPv6 compatible
    verifiedByUserAgent: text("verified_by_user_agent"),
    verificationLocation: text("verification_location"), // Optional geolocation

    // Verification result
    isValid: boolean("is_valid").notNull(),
    verificationMethod: varchar("verification_method", { length: 50 }), // 'qr_scan', 'token', 'manual'
    verificationNotes: text("verification_notes"),

    ...timestamps,
  },
  (table) => [
    index("document_verifications_document_id_idx").using(
      "btree",
      table.documentId,
    ),
    index("document_verifications_created_at_idx").using(
      "btree",
      table.createdAt,
    ),
  ],
);

export const documentSignatures = createTable(
  "document_signatures",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),

    // Link to parent document
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    // Signer information
    signedByUserId: uuid("signed_by_user_id")
      .notNull()
      .references(() => users.id),
    signerName: varchar("signer_name", { length: 255 }).notNull(), // Cached for display
    signerEmail: varchar("signer_email", { length: 255 }), // Optional, cached from user

    // Signature purpose and details
    purpose: text("purpose").notNull(), // Why this person is signing
    signatureOrder: integer("signature_order"), // Order of signature (1st, 2nd, etc.)

    // QR Code information
    qrCodePosition: jsonb("qr_code_position").notNull(), // {x, y, width, height, page}
    verificationToken: varchar("verification_token", { length: 255 })
      .notNull()
      .unique(), // Unique token for this signature
    verificationUrl: text("verification_url").notNull(), // Full URL with token

    // Cryptographic signature data
    signatureData: text("signature_data").notNull(), // JWT signature
    fileHash: varchar("file_hash", { length: 64 }).notNull(), // SHA-256 hash at signing time

    // Timestamps
    signedAt: timestamp("signed_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }), // Optional expiration

    ...timestamps,
  },
  (table) => [
    index("document_signatures_document_id_idx").using(
      "btree",
      table.documentId,
    ),
    index("document_signatures_signed_by_idx").using(
      "btree",
      table.signedByUserId,
    ),
    index("document_signatures_verification_token_idx").using(
      "btree",
      table.verificationToken,
    ),
    index("document_signatures_created_at_idx").using("btree", table.createdAt),
  ],
);

export const positions = createTable(
  "positions",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    name: varchar("name", { length: 250 }).notNull().unique(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [index("position_name_idx").using("btree", table.name)],
);

export const employees = createTable(
  "employees",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    positionId: uuid("position_id")
      .notNull()
      .references(() => positions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 250 }).notNull(),
    email: varchar("email", { length: 250 }).notNull().unique(),
    status: employeeStatusEnum("status").notNull().default("siap"),
    ...timestamps,
  },
  (table) => [
    index("employee_id_idx").using("btree", table.id),
    index("employee_user_id_idx").using("btree", table.userId),
    index("employee_email_idx").using("btree", table.email),
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

export const notifications = createTable(
  "notifications",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull().default("general"),
    title: varchar("title", { length: 250 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true, mode: "string" }),
    // Optional: link to related entities
    orderId: uuid("order_id").references(() => order.id, {
      onDelete: "cascade",
    }),
    testingId: uuid("testing_id").references(() => testing.id, {
      onDelete: "cascade",
    }),
    documentId: uuid("document_id").references(() => documents.id, {
      onDelete: "cascade",
    }),
    // Metadata for additional context (e.g., old/new status, triggeredBy user, etc.)
    metadata: jsonb("metadata"),
    ...timestamps,
  },
  (table) => [
    index("notifications_user_id_idx").using("btree", table.userId),
    index("notifications_is_read_idx").using("btree", table.isRead),
    index("notifications_user_read_idx").using(
      "btree",
      table.userId,
      table.isRead,
    ),
    index("notifications_created_at_idx").using("btree", table.createdAt),
    index("notifications_type_idx").using("btree", table.type),
  ],
);
