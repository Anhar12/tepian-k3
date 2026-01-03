import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  index,
  integer,
  pgEnum,
  pgSequence,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";
import {
  createFileColumns,
  createRequiredFileColumns,
  timestamps,
} from "./utils";
import {
  ORDER_APPROVAL_STATUSES,
  ORDER_PAYMENT_STATUSES,
  ORDER_SEQUENCE_NAME,
  ORDER_STATUS,
  PERMISSION_ACTION,
  TESTING_SEQUENCE_NAME,
  TESTING_STATUSES,
  TOOLS_AVAILABILITY,
  TOOLS_CONDITIONS,
} from "@tepian-k3/constants";

export const createTable = pgTableCreator((name) => `${name}`);

export const permissionActionEnum = pgEnum("action", PERMISSION_ACTION);

export const ToolsConditionEnum = pgEnum("tools_condition", TOOLS_CONDITIONS);

export const orderStatusEnum = pgEnum("order_status", ORDER_STATUS);

export const testingStatusEnum = pgEnum("testing_status", TESTING_STATUSES);

export const approvalStatusEnum = pgEnum(
  "approval_status",
  ORDER_APPROVAL_STATUSES
);

export const paymentStatusEnum = pgEnum(
  "payment_status",
  ORDER_PAYMENT_STATUSES
);

export const ToolsAvailabilityEnum = pgEnum(
  "tools_availability",
  TOOLS_AVAILABILITY
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
    ...createFileColumns("profile_picture"),
    ...timestamps,
  },
  (table) => [
    unique("user_email_unique_idx").on(table.email),
    index("user_idx").using("btree", table.id),
    index("user_email_idx").using("btree", table.email),
    uniqueIndex("email_deleted_at_unique_idx")
      .on(table.email)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
);

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
  ]
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
  (table) => [index("kbli_id_idx").using("btree", table.id)]
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
    ...createRequiredFileColumns("companyPicture"),
    ...timestamps,
  },
  (table) => [
    index("user_company_id_idx").using("btree", table.id),
    index("user_company_user_id_idx").using("btree", table.userId),
  ]
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
      table.userCompanyId
    ),
  ]
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
  ]
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
  (table) => [index("role_name_idx").using("btree", table.name)]
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
      table.action
    ),
  ]
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
      table.permissionId
    ),
    primaryKey({
      columns: [table.roleId, table.permissionId],
    }),
  ]
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
      table.permissionId
    ),
  ]
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
  ]
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
  ]
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
  ]
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
      table.parameterCategoryId
    ),
    index("parameter_name_idx").using("btree", table.name),
  ]
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
  ]
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
  ]
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
  ]
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
  ]
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
  ]
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
  ]
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
    ...createFileColumns("offeringDocument"),
    ...createFileColumns("offeringUserDocument"),
    approvalStatus: approvalStatusEnum("approval_status")
      .notNull()
      .default("pending"),
    approvalRejectReason: text("approval_reject_reason"),
    ...createFileColumns("invoice"),
    ...createFileColumns("proofOfPayment"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("unpaid"),
    paymentRejectedReason: text("payment_rejected_reason"),
    ...createFileColumns("assignmentLetter"),
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
  ]
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
  ]
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
  ]
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
  ]
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
    previousStatus: orderStatusEnum("previous_status").notNull(),
    newStatus: orderStatusEnum("new_status").notNull(),
    changedBy: uuid("changed_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    note: text("note"),
    ...timestamps,
  },

  (table) => [
    index("order_status_history_id_idx").using("btree", table.id),
    index("order_status_history_order_id_idx").using("btree", table.orderId),
  ]
);
