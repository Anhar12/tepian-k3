import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
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
import { timestamps } from "./utils";
import {
  PERMISSION_ACTION,
  TOOLS_AVAILABILITY,
  TOOLS_CONDITIONS,
} from "@tepian-k3/constants";

export const createTable = pgTableCreator((name) => `${name}`);

export const permissionActionEnum = pgEnum("action", PERMISSION_ACTION);

export const ToolsConditionEnum = pgEnum("tools_condition", TOOLS_CONDITIONS);

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
    profilePictureFileName: text("profile_picture_file_name"),
    profilePictureUrl: text("profile_picture_url"),
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

export const userCompanies = createTable("user_companies", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .$default(() => uuidv7()),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 250 }).notNull(),
  companyAddress: text("company_address").notNull(),
  ...timestamps,
});

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
