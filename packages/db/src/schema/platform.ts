import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  primaryKey,
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
import { desc, sql } from "drizzle-orm";
import {
  AUDIT_ACTIONS,
  DOCUMENT_ENTITY_TYPES,
  DOCUMENT_STATUS,
  DOCUMENT_TYPES,
  EMPLOYEE_STATUS,
  NOTIFICATION_TYPES,
  PERMISSION_ACTION,
} from "@tepian-k3/constants";

export const permissionActionEnum = pgEnum("action", PERMISSION_ACTION);

export const employeeStatusEnum = pgEnum("employee_status", EMPLOYEE_STATUS);

export const notificationTypeEnum = pgEnum(
  "notification_type",
  NOTIFICATION_TYPES,
);

export const auditActionEnum = pgEnum("audit_action", AUDIT_ACTIONS);

export const documentEntityTypeEnum = pgEnum(
  "document_entity_type",
  DOCUMENT_ENTITY_TYPES,
);

export const documentTypeEnum = pgEnum("document_type", DOCUMENT_TYPES);

export const documentStatusEnum = pgEnum("document_status", DOCUMENT_STATUS);

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
    verificationStatus: varchar("verification_status", { length: 50 })
      .notNull()
      .default("pending"),
    verificationRejectionReason: text("verification_rejection_reason"),
    ...createFileUrlColumn("profilePicture"),
    ...timestamps,
  },
  (table) => [
    index("user_idx").using("btree", table.id),
    index("user_email_idx").using("btree", table.email),
    uniqueIndex("email_deleted_at_unique_idx")
      .on(table.email)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
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
    type: text("type").notNull(),
    nip: varchar("nip", { length: 100 }).notNull().unique(),
    status: employeeStatusEnum("status").notNull().default("siap"),
    ...timestamps,
  },
  (table) => [
    index("employee_id_idx").using("btree", table.id),
    index("employee_user_id_idx").using("btree", table.userId),
    index("employee_email_idx").using("btree", table.email),
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

export const employeeCertifications = createTable(
  "employee_certifications",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    certificationName: varchar("certification_name", { length: 255 }).notNull(),
    issuedBy: varchar("issued_by", { length: 255 }).notNull(),
    issueDate: timestamp("issue_date", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    expiryDate: timestamp("expiry_date", {
      withTimezone: true,
      mode: "string",
    }),
    ...createRequiredFileUrlColumn("certificate_file"),
    ...timestamps,
  },
  (table) => [
    index("employee_certification_id_idx").using("btree", table.id),
    index("employee_certification_employee_id_idx").using(
      "btree",
      table.employeeId,
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
    name: varchar("name", { length: 250 }).notNull(),
    ...timestamps,
  },

  (table) => [index("province_name_idx").using("btree", table.name)],
);

export const regencies = createTable(
  "regencies",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    provinceId: uuid("province_id")
      .notNull()
      .references(() => provinces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 250 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("regency_name_idx").using("btree", table.name),
    index("regency_province_id_idx").using("btree", table.provinceId),
  ],
);

export const districts = createTable(
  "districts",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    regencyId: uuid("regency_id")
      .notNull()
      .references(() => regencies.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 250 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("district_name_idx").using("btree", table.name),
    index("district_regency_id_idx").using("btree", table.regencyId),
  ],
);

export const villages = createTable(
  "villages",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    districtId: uuid("district_id")
      .notNull()
      .references(() => districts.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 250 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("village_name_idx").using("btree", table.name),
    index("village_district_id_idx").using("btree", table.districtId),
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
    orderId: uuid("order_id"),
    testingId: uuid("testing_id"),
    documentId: uuid("document_id"),
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
      .references(() => users.id, { onDelete: "set null" }),
    signedByUserId: uuid("signed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

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
      .references(() => users.id, { onDelete: "set null" }),
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

export const banners = createTable(
  "banners",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    ...createRequiredFileUrlColumn("banner"),
    title: varchar("title", { length: 255 }).notNull(),
    order: integer("order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("banner_id_idx").using("btree", table.id),
    index("banner_order_idx").using("btree", table.order),
    index("banner_is_active_idx").using("btree", table.isActive),
  ],
);

export const news = createTable(
  "news",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    ...createRequiredFileUrlColumn("image"),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
      mode: "string",
    }),
    ...timestamps,
  },
  (table) => [
    index("news_id_idx").using("btree", table.id),
    index("news_is_published_idx").using("btree", table.isPublished),
    index("news_published_at_idx").using("btree", table.publishedAt),
  ],
);

export const faqs = createTable(
  "faqs",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    category: varchar("category", { length: 100 }).notNull().default("general"),
    orderIndex: integer("order_index").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("faq_id_idx").using("btree", table.id),
    index("faq_category_idx").using("btree", table.category),
    index("faq_is_active_idx").using("btree", table.isActive),
  ],
);

export const settings = createTable(
  "settings",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    key: varchar("key", { length: 250 }).notNull(),
    value: text("value").notNull(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("settings_key_unique_idx")
      .on(table.key)
      .where(sql`${table.deletedAt} IS NULL`),
    index("settings_id_idx").using("btree", table.id),
  ],
);
