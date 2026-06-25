# Pelatihan (Training) Feature Design

## Overview

The Pelatihan feature allows users to enroll in training courses, complete pre-tests, study materials, take post-tests, and receive certificates upon successful completion. Trainings can be **free** or **paid**, with paid trainings requiring checkout through the cart and order system.

## Database Schema

### Core Tables

#### 1. `pelatihan` (Training Courses)

```typescript
export const pelatihan = createTable(
  "pelatihan",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    title: varchar("title", { length: 250 }).notNull(),
    slug: varchar("slug", { length: 250 }).notNull().unique(),
    description: text("description"),
    shortDescription: varchar("short_description", { length: 500 }),

    // Course details
    categoryId: uuid("category_id").references(() => pelatihanCategories.id),
    level: pelatihanLevelEnum("level").notNull(), // beginner, intermediate, advanced
    duration: integer("duration").notNull(), // in hours
    capacity: integer("capacity"), // max participants per batch

    // Pricing
    price: integer("price").notNull().default(0),
    discountPrice: integer("discount_price"),

    // Requirements
    prerequisiteIds: uuid("prerequisite_ids").array(), // Array of training IDs that must be completed first
    minimumScore: integer("minimum_score").notNull().default(70), // Required score to pass (percentage)

    // Status
    status: pelatihanStatusEnum("status").notNull().default("draft"), // draft, published, archived
    publishedAt: timestamp("published_at", { withTimezone: true }),

    // Media
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),

    // Metadata
    instructorName: varchar("instructor_name", { length: 250 }),
    instructorBio: text("instructor_bio"),

    ...timestamps,
  },
  (table) => ({
    slugIdx: uniqueIndex("pelatihan_slug_idx")
      .on(table.slug)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);

// Enums
export const pelatihanLevelEnum = pgEnum("pelatihan_level", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const pelatihanStatusEnum = pgEnum("pelatihan_status", [
  "draft",
  "published",
  "archived",
]);
```

#### 2. `pelatihan_categories` (Training Categories)

```typescript
export const pelatihanCategories = createTable("pelatihan_categories", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .$default(() => uuidv7()),
  name: varchar("name", { length: 250 }).notNull(),
  slug: varchar("slug", { length: 250 }).notNull().unique(),
  description: text("description"),
  iconUrl: varchar("icon_url", { length: 500 }),
  orderIndex: integer("order_index").notNull().default(0),

  ...timestamps,
});
```

#### 3. `pelatihan_cart` (Shopping Cart for Trainings)

```typescript
export const pelatihanCart = createTable(
  "pelatihan_cart",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pelatihanId: uuid("pelatihan_id")
      .notNull()
      .references(() => pelatihan.id, { onDelete: "cascade" }),

    quantity: integer("quantity").notNull().default(1), // Usually 1 for trainings, but could be batch enrollment

    // Pricing snapshot (in case price changes)
    unitPrice: integer("unit_price").notNull(),
    discountPrice: integer("discount_price"),

    ...timestamps,
  },
  (table) => ({
    userPelatihanIdx: uniqueIndex("cart_user_pelatihan_idx")
      .on(table.userId, table.pelatihanId)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);
```

#### 4. `pelatihan_materials` (Learning Materials)

```typescript
export const pelatihanMaterials = createTable("pelatihan_materials", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .$default(() => uuidv7()),
  pelatihanId: uuid("pelatihan_id")
    .notNull()
    .references(() => pelatihan.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 250 }).notNull(),
  description: text("description"),
  type: materialTypeEnum("type").notNull(), // ppt, pdf, video, document, link

  // File storage
  fileUrl: varchar("file_url", { length: 500 }),
  fileSize: integer("file_size"), // in bytes
  mimeType: varchar("mime_type", { length: 100 }),

  // For videos
  duration: integer("duration"), // in seconds

  // Ordering
  orderIndex: integer("order_index").notNull().default(0),

  // Access control
  isPreview: boolean("is_preview").notNull().default(false), // Can be viewed without enrollment

  ...timestamps,
});

export const materialTypeEnum = pgEnum("material_type", [
  "ppt",
  "pdf",
  "video",
  "document",
  "link",
]);
```

#### 5. `pelatihan_assessments` (Pre-test & Post-test)

```typescript
export const pelatihanAssessments = createTable("pelatihan_assessments", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .$default(() => uuidv7()),
  pelatihanId: uuid("pelatihan_id")
    .notNull()
    .references(() => pelatihan.id, { onDelete: "cascade" }),

  type: assessmentTypeEnum("type").notNull(), // pre_test, post_test
  title: varchar("title", { length: 250 }).notNull(),
  description: text("description"),

  // Configuration
  passingScore: integer("passing_score").notNull().default(70), // percentage
  timeLimit: integer("time_limit"), // in minutes, null = no limit
  maxAttempts: integer("max_attempts"), // null = unlimited

  // Randomization
  randomizeQuestions: boolean("randomize_questions").notNull().default(false),
  randomizeOptions: boolean("randomize_options").notNull().default(false),

  // When to show
  availableAfter: integer("available_after"), // Show after X materials completed (null = available immediately)

  ...timestamps,
});

export const assessmentTypeEnum = pgEnum("assessment_type", [
  "pre_test",
  "post_test",
]);
```

#### 6. `pelatihan_questions` (Assessment Questions)

```typescript
export const pelatihanQuestions = createTable("pelatihan_questions", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .$default(() => uuidv7()),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => pelatihanAssessments.id, { onDelete: "cascade" }),

  questionText: text("question_text").notNull(),
  type: questionTypeEnum("type").notNull(), // multiple_choice, true_false, essay

  // Scoring
  points: integer("points").notNull().default(1),

  // For auto-grading (multiple_choice, true_false)
  correctAnswer: text("correct_answer"), // JSON array of correct option IDs or boolean

  // Explanation (shown after submission)
  explanation: text("explanation"),

  // Ordering
  orderIndex: integer("order_index").notNull().default(0),

  ...timestamps,
});

export const questionTypeEnum = pgEnum("question_type", [
  "multiple_choice",
  "true_false",
  "essay",
]);
```

#### 7. `pelatihan_question_options` (Multiple Choice Options)

```typescript
export const pelatihanQuestionOptions = createTable(
  "pelatihan_question_options",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    questionId: uuid("question_id")
      .notNull()
      .references(() => pelatihanQuestions.id, { onDelete: "cascade" }),

    optionText: text("option_text").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    orderIndex: integer("order_index").notNull().default(0),

    ...timestamps,
  },
);
```

#### 8. `pelatihan_enrollments` (User Enrollments)

```typescript
export const pelatihanEnrollments = createTable(
  "pelatihan_enrollments",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    pelatihanId: uuid("pelatihan_id")
      .notNull()
      .references(() => pelatihan.id),

    // Enrollment details
    status: enrollmentStatusEnum("status").notNull().default("enrolled"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }), // Access expiration

    // Payment (if integrated with order system)
    orderId: uuid("order_id").references(() => order.id),

    // Progress tracking
    progressPercentage: integer("progress_percentage").notNull().default(0),

    // Certificate
    certificateUrl: varchar("certificate_url", { length: 500 }),
    certificateIssuedAt: timestamp("certificate_issued_at", {
      withTimezone: true,
    }),

    // Scores
    preTestScore: integer("pre_test_score"), // percentage
    postTestScore: integer("post_test_score"), // percentage
    finalScore: integer("final_score"), // calculated average or weighted score

    ...timestamps,
  },
  (table) => ({
    userPelatihanIdx: uniqueIndex("enrollment_user_pelatihan_idx")
      .on(table.userId, table.pelatihanId)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "enrolled", // Enrolled but not started
  "in_progress", // Started learning
  "completed", // Passed all requirements
  "failed", // Did not pass
  "expired", // Access expired
]);
```

#### 9. `pelatihan_progress` (Material Completion Tracking)

```typescript
export const pelatihanProgress = createTable(
  "pelatihan_progress",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),

    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => pelatihanEnrollments.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => pelatihanMaterials.id, { onDelete: "cascade" }),

    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    // For videos - track watch time
    watchedDuration: integer("watched_duration"), // in seconds

    ...timestamps,
  },
  (table) => ({
    enrollmentMaterialIdx: uniqueIndex("progress_enrollment_material_idx")
      .on(table.enrollmentId, table.materialId)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);
```

#### 10. `pelatihan_assessment_attempts` (Test Attempts)

```typescript
export const pelatihanAssessmentAttempts = createTable(
  "pelatihan_assessment_attempts",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),

    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => pelatihanEnrollments.id, { onDelete: "cascade" }),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => pelatihanAssessments.id, { onDelete: "cascade" }),

    attemptNumber: integer("attempt_number").notNull(),

    // Attempt details
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),

    // Results
    score: integer("score"), // percentage
    totalPoints: integer("total_points"),
    earnedPoints: integer("earned_points"),
    passed: boolean("passed"),

    // State
    status: attemptStatusEnum("status").notNull().default("in_progress"),

    ...timestamps,
  },
);

export const attemptStatusEnum = pgEnum("attempt_status", [
  "in_progress",
  "submitted",
  "graded", // For essays that need manual grading
  "reviewed", // Final review complete
]);
```

#### 11. `pelatihan_assessment_answers` (User Answers)

```typescript
export const pelatihanAssessmentAnswers = createTable(
  "pelatihan_assessment_answers",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),

    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => pelatihanAssessmentAttempts.id, {
        onDelete: "cascade",
      }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => pelatihanQuestions.id),

    // User's answer
    answer: text("answer").notNull(), // JSON: selected option IDs, boolean, or essay text

    // Grading
    isCorrect: boolean("is_correct"),
    pointsEarned: integer("points_earned").notNull().default(0),

    // Manual grading (for essays)
    gradedBy: uuid("graded_by").references(() => users.id),
    gradedAt: timestamp("graded_at", { withTimezone: true }),
    feedback: text("feedback"), // Grader's feedback

    ...timestamps,
  },
  (table) => ({
    attemptQuestionIdx: uniqueIndex("answer_attempt_question_idx")
      .on(table.attemptId, table.questionId)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);
```

#### 12. `pelatihan_certificates` (Certificates - Integration with Documents)

```typescript
export const pelatihanCertificates = createTable(
  "pelatihan_certificates",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),

    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => pelatihanEnrollments.id)
      .unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    pelatihanId: uuid("pelatihan_id")
      .notNull()
      .references(() => pelatihan.id),

    // Certificate details
    certificateNumber: varchar("certificate_number", { length: 100 })
      .notNull()
      .unique(),
    issuedAt: timestamp("issued_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }), // Some certificates expire

    // Document
    documentId: uuid("document_id").references(() => documents.id), // Link to documents table
    documentUrl: varchar("document_url", { length: 500 }).notNull(),

    // Verification (use existing document verification system)
    verificationToken: text("verification_token").notNull(),
    qrCodeUrl: varchar("qr_code_url", { length: 500 }),

    // Metadata
    instructorName: varchar("instructor_name", { length: 250 }),
    finalScore: integer("final_score").notNull(),
    completionDate: timestamp("completion_date", {
      withTimezone: true,
    }).notNull(),

    ...timestamps,
  },
  (table) => ({
    certificateNumberIdx: uniqueIndex("certificate_number_idx")
      .on(table.certificateNumber)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);
```

#### 13. `pelatihan_schedules` (Training Class Schedules)

```typescript
export const pelatihanSchedules = createTable("pelatihan_schedules", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .$default(() => uuidv7()),
  pelatihanId: uuid("pelatihan_id")
    .notNull()
    .references(() => pelatihan.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 250 }).notNull(),
  description: text("description"),
  sessionDate: timestamp("session_date", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  startTime: varchar("start_time", { length: 50 }).notNull(),
  endTime: varchar("end_time", { length: 50 }).notNull(),
  room: varchar("room", { length: 250 }),
  category: varchar("category", { length: 100 }),
  materialUrl: varchar("material_url", { length: 500 }),
  meetUrl: varchar("meet_url", { length: 500 }),
  attendanceToken: varchar("attendance_token", { length: 10 }), // 10 characters token for verification
  ...timestamps,
});
```

#### 14. `pelatihan_attendances` (Participant Attendance Records)

```typescript
export const pelatihanAttendances = createTable(
  "pelatihan_attendances",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => pelatihanEnrollments.id, { onDelete: "cascade" }),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => pelatihanSchedules.id, { onDelete: "cascade" }),
    status: attendanceStatusEnum("status").notNull().default("present"),
    checkedInAt: timestamp("checked_in_at", {
      withTimezone: true,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("attendance_enrollment_schedule_idx")
      .on(table.enrollmentId, table.scheduleId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);
```

#### 15. `user_training_profiles` (Participant & Company Profiles)

```typescript
export const userTrainingProfiles = createTable(
  "user_training_profiles",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    // Company Information
    companyName: varchar("company_name", { length: 250 }),
    companyAddress: text("company_address"),
    companyProvinceId: uuid("company_province_id").references(
      () => provinces.id,
      {
        onDelete: "set null",
      },
    ),
    companyRegencyId: uuid("company_regency_id").references(
      () => regencies.id,
      {
        onDelete: "set null",
      },
    ),
    companyDistrictId: uuid("company_district_id").references(
      () => districts.id,
      {
        onDelete: "set null",
      },
    ),
    companyKbli: varchar("company_kbli", { length: 250 }),

    // Participant Information
    participantName: varchar("participant_name", { length: 250 }),
    participantNik: varchar("participant_nik", { length: 50 }),
    participantBirthPlace: varchar("participant_birth_place", { length: 250 }),
    participantBirthDate: timestamp("participant_birth_date", {
      withTimezone: true,
      mode: "string",
    }),
    participantPhone: varchar("participant_phone", { length: 50 }),
    participantAddress: text("participant_address"),
    participantBloodType: varchar("participant_blood_type", { length: 10 }),
    participantProvinceId: uuid("participant_province_id").references(
      () => provinces.id,
      {
        onDelete: "set null",
      },
    ),
    participantRegencyId: uuid("participant_regency_id").references(
      () => regencies.id,
      {
        onDelete: "set null",
      },
    ),
    participantDistrictId: uuid("participant_district_id").references(
      () => districts.id,
      {
        onDelete: "set null",
      },
    ),

    ...timestamps,
  },
  (table) => [
    index("user_training_profile_user_id_idx").using("btree", table.userId),
  ],
);
```

## API Structure

### tRPC Routers

Create the following routers in `packages/api/src/routers/`:

1. **`pelatihan.ts`** - Training course CRUD
   - `getAll` - List all published trainings
   - `getPaginated` - Paginated list with filters
   - `getById` - Get training details
   - `getBySlug` - Get training by slug (public)
   - `create` - Create training (admin)
   - `update` - Update training (admin)
   - `delete` - Soft delete training (admin)
   - `publish` - Publish training (admin)
   - `archive` - Archive training (admin)

2. **`pelatihan-categories.ts`** - Category management
   - Standard CRUD operations
   - `reorder` - Change category order

3. **`pelatihan-cart.ts`** - Shopping cart for trainings
   - `getMyCart` - Get user's cart items
   - `addToCart` - Add training to cart
   - `updateQuantity` - Update cart item quantity
   - `removeFromCart` - Remove item from cart
   - `clearCart` - Clear entire cart
   - `getCartSummary` - Get cart total and item count

4. **`pelatihan-materials.ts`** - Learning materials
   - `getByPelatihanId` - Get all materials for a training
   - `create` - Upload material (admin)
   - `update` - Update material (admin)
   - `delete` - Delete material (admin)
   - `reorder` - Change material order
   - `uploadFile` - Handle file uploads (PPT, PDF, etc.)

5. **`pelatihan-assessments.ts`** - Pre/Post tests
   - `getByPelatihanId` - Get assessments for a training
   - `getById` - Get assessment with questions
   - `create` - Create assessment (admin)
   - `update` - Update assessment (admin)
   - `delete` - Delete assessment (admin)

6. **`pelatihan-questions.ts`** - Question management
   - `getByAssessmentId` - Get questions for an assessment
   - `create` - Create question with options (admin)
   - `update` - Update question (admin)
   - `delete` - Delete question (admin)
   - `reorder` - Change question order

7. **`pelatihan-enrollments.ts`** - User enrollments
   - `enroll` - Enroll in training
   - `getMyEnrollments` - Get user's enrollments
   - `getEnrollmentDetails` - Get enrollment with progress
   - `startTraining` - Mark enrollment as started
   - `canEnroll` - Check if user can enroll (prerequisites, etc.)

8. **`pelatihan-progress.ts`** - Progress tracking
   - `markMaterialComplete` - Mark material as completed
   - `updateWatchTime` - Update video watch time
   - `getProgress` - Get user's progress for a training

9. **`pelatihan-assessment-attempts.ts`** - Test taking
   - `startAttempt` - Start a new attempt
   - `submitAnswer` - Submit answer for a question
   - `submitAttempt` - Submit entire attempt
   - `getAttempt` - Get attempt details
   - `getAttemptResults` - Get graded results

10. **`pelatihan-certificates.ts`** - Certificate management

- `generate` - Generate certificate after completion
- `getMyCertificates` - Get user's certificates
- `verify` - Verify certificate by token/number
- `download` - Download certificate PDF

## Services

### Certificate Generation Service

Create `packages/services/src/pelatihan-certificate/index.ts`:

```typescript
import { Effect } from "effect";
import { pdfService } from "../pdf";
import { documentSigningService } from "../document-signing";
import { storageService } from "../storage";

export const generatePelatihanCertificate = (data: {
  userName: string;
  pelatihanTitle: string;
  completionDate: Date;
  certificateNumber: string;
  instructorName: string;
  finalScore: number;
  duration: number;
}) =>
  Effect.gen(function* () {
    // 1. Generate PDF with certificate template
    const pdfBuffer = yield* pdfService.generateCertificate({
      template: "pelatihan-certificate",
      data,
    });

    // 2. Generate verification token
    const verificationToken = yield* documentSigningService.createToken({
      documentType: "pelatihan_certificate",
      metadata: {
        certificateNumber: data.certificateNumber,
        userId: data.userId,
      },
      expiresIn: "10y", // Certificates don't expire
    });

    // 3. Generate QR code with verification URL
    const qrCodeBuffer = yield* documentSigningService.generateQR({
      url: `${process.env.DOCUMENT_VERIFICATION_BASE_URL}/verify/${verificationToken}`,
    });

    // 4. Embed QR code in PDF
    const finalPdfBuffer = yield* pdfService.embedQRCode(
      pdfBuffer,
      qrCodeBuffer,
      {
        x: 500,
        y: 50,
        width: 80,
        height: 80,
      },
    );

    // 5. Upload to storage
    const uploaded = yield* storageService.upload(
      finalPdfBuffer,
      `certificates/pelatihan/${data.certificateNumber}.pdf`,
      "application/pdf",
    );

    return {
      documentUrl: uploaded.url,
      verificationToken,
    };
  });
```

## Query Functions

Create in `packages/queries/src/`:

- `pelatihan.queries.ts`
- `pelatihan-categories.queries.ts`
- `pelatihan-materials.queries.ts`
- `pelatihan-assessments.queries.ts`
- `pelatihan-questions.queries.ts`
- `pelatihan-enrollments.queries.ts`
- `pelatihan-progress.queries.ts`
- `pelatihan-assessment-attempts.queries.ts`
- `pelatihan-certificates.queries.ts`

All should use Effect-based error handling patterns.

## Validation Schemas

Create in `packages/schema/src/`:

- `pelatihan.schema.ts`
- `pelatihan-categories.schema.ts`
- `pelatihan-materials.schema.ts`
- `pelatihan-assessments.schema.ts`
- `pelatihan-questions.schema.ts`
- `pelatihan-enrollments.schema.ts`
- `pelatihan-progress.schema.ts`
- `pelatihan-assessment-attempts.schema.ts`

Example:

```typescript
// pelatihan-enrollments.schema.ts
export const enrollSchema = z.object({
  pelatihanId: z.uuidv7(),
  paymentMethod: z.enum(["free", "order"]).optional(),
});

export const markMaterialCompleteSchema = z.object({
  enrollmentId: z.uuidv7(),
  materialId: z.uuidv7(),
  watchedDuration: z.number().optional(),
});

export const startAssessmentSchema = z.object({
  enrollmentId: z.uuidv7(),
  assessmentId: z.uuidv7(),
});

export const submitAnswerSchema = z.object({
  attemptId: z.uuidv7(),
  questionId: z.uuidv7(),
  answer: z.union([
    z.array(z.uuidv7()), // Multiple choice
    z.boolean(), // True/false
    z.string(), // Essay
  ]),
});
```

## Frontend Routes

Create in `apps/web/src/routes/(core)/pelatihan/`:

```
pelatihan/
├── index.tsx                    # Browse trainings (public)
├── $slug/
│   ├── index.tsx               # Training details (public)
│   └── enroll.tsx              # Direct enrollment (free trainings only)
├── cart/
│   ├── index.tsx               # Cart page
│   └── checkout.tsx            # Checkout (creates order)
├── my-trainings/
│   ├── index.tsx               # User's enrollments list
│   └── $enrollmentId/
│       ├── index.tsx           # Training dashboard
│       ├── materials/
│       │   └── $materialId.tsx # View material
│       ├── assessment/
│       │   └── $assessmentId/
│       │       ├── index.tsx   # Assessment instructions
│       │       ├── take.tsx    # Take test
│       │       └── results.tsx # View results
│       └── certificate.tsx     # View/download certificate
└── admin/                      # Admin routes
    ├── index.tsx               # Manage trainings
    ├── create.tsx              # Create training
    ├── $id/
    │   ├── edit.tsx            # Edit training
    │   ├── materials.tsx       # Manage materials
    │   ├── assessments/
    │   │   ├── index.tsx       # List assessments
    │   │   └── $assessmentId/
    │   │       └── questions.tsx # Manage questions
    │   └── enrollments.tsx     # View enrollments
```

## Permissions

Add to existing permissions:

```typescript
// packages/constants/src/permissions.ts
export const PELATIHAN_PERMISSIONS = {
  // Training management
  "pelatihan.read": "View trainings",
  "pelatihan.create": "Create trainings",
  "pelatihan.update": "Update trainings",
  "pelatihan.delete": "Delete trainings",
  "pelatihan.publish": "Publish trainings",

  // Material management
  "pelatihan.materials.create": "Upload materials",
  "pelatihan.materials.update": "Update materials",
  "pelatihan.materials.delete": "Delete materials",

  // Assessment management
  "pelatihan.assessments.create": "Create assessments",
  "pelatihan.assessments.update": "Update assessments",
  "pelatihan.assessments.delete": "Delete assessments",

  // Grading
  "pelatihan.grade": "Grade essay questions",

  // Enrollment management
  "pelatihan.enrollments.view": "View all enrollments",
  "pelatihan.enrollments.manage": "Manage enrollments",

  // Certificate management
  "pelatihan.certificates.issue": "Issue certificates",
  "pelatihan.certificates.revoke": "Revoke certificates",
} as const;
```

## Integration Points

### 1. Cart & Order System Integration

#### Free Enrollment (Direct)

For free trainings (price = 0), users can enroll directly:

```typescript
// Check if training is free
if (pelatihan.price === 0) {
  // Direct enrollment without payment
  const enrollment = await createEnrollment({
    userId,
    pelatihanId,
    status: "enrolled",
  });

  // Log audit
  await auditService.log("ENROLL_FREE", "pelatihan_enrollment", enrollment.id);
}
```

#### Paid Enrollment (Cart + Checkout)

For paid trainings, users go through cart and checkout flow:

```typescript
// 1. Add to cart
const cartItem = await addToCart({
  userId,
  pelatihanId,
  quantity: 1,
  unitPrice: pelatihan.price,
  discountPrice: pelatihan.discountPrice,
});

// 2. Checkout - Create order from cart
const order = await createOrderFromPelatihanCart({
  userId,
  cartItems: userCartItems,
});

// 3. User uploads payment proof (existing order system)
await uploadPaymentProof(orderId, file);

// 4. Admin confirms payment
await confirmPayment(orderId);

// 5. After payment confirmed, create enrollments automatically
for (const item of order.items) {
  if (item.type === "pelatihan") {
    const enrollment = await createEnrollment({
      userId: order.userId,
      pelatihanId: item.pelatihanId,
      orderId: order.id,
      status: "enrolled",
    });
  }
}

// 6. Clear cart after successful checkout
await clearCart(userId);
```

#### Order Item Type Extension

Extend existing `order` and `orderItem` tables to support pelatihan:

```typescript
// In existing order system, add new item type
export const orderItemTypeEnum = pgEnum("order_item_type", [
  "testing", // Existing
  "pelatihan", // NEW: Training course
  "consultation",
  "other",
]);

// orderItem table already has polymorphic structure:
// - type: "pelatihan"
// - entityId: pelatihanId
// - quantity, unitPrice, etc.
```

### 2. Document Verification Integration

Use existing document verification system:

```typescript
// Certificate verification route
export const Route = createFileRoute("/verify/$token")({
  loader: async ({ params }) => {
    const result = await trpcClient.pelatihanCertificates.verify.query({
      token: params.token,
    });
    return result;
  },
});
```

### 3. Audit Logging

Log important actions:

```typescript
// On enrollment
await auditService.log("CREATE", "pelatihan_enrollment", enrollmentId);

// On certificate issuance
await auditService.log("ISSUE", "pelatihan_certificate", certificateId);

// On assessment submission
await auditService.log("SUBMIT", "pelatihan_assessment_attempt", attemptId);
```

## User Flow

### Student Journey

#### Free Training Flow

1. **Browse Trainings** → `/pelatihan`
2. **View Details** → `/pelatihan/k3-dasar-pemula`
3. **Direct Enroll** → Click "Enroll Now" (instant enrollment)
4. **Take Pre-test** → `/pelatihan/my-trainings/{id}/assessment/pre-test/take`
5. **Study Materials** → `/pelatihan/my-trainings/{id}/materials/{materialId}`
6. **Take Post-test** → `/pelatihan/my-trainings/{id}/assessment/post-test/take`
7. **Get Certificate** → `/pelatihan/my-trainings/{id}/certificate`

#### Paid Training Flow

1. **Browse Trainings** → `/pelatihan`
2. **View Details** → `/pelatihan/k3-dasar-pemula`
3. **Add to Cart** → Click "Add to Cart"
4. **View Cart** → `/pelatihan/cart`
5. **Checkout** → `/pelatihan/checkout` (creates order)
6. **Upload Payment** → `/pengujian/status/{orderId}` (existing order page)
7. **Wait for Approval** → Admin confirms payment
8. **Access Training** → Enrollment auto-created after payment
9. **Take Pre-test** → `/pelatihan/my-trainings/{id}/assessment/pre-test/take`
10. **Study Materials** → `/pelatihan/my-trainings/{id}/materials/{materialId}`
11. **Take Post-test** → `/pelatihan/my-trainings/{id}/assessment/post-test/take`
12. **Get Certificate** → `/pelatihan/my-trainings/{id}/certificate`

### Admin Journey

1. **Create Training** → `/pelatihan/admin/create`
2. **Upload Materials** → `/pelatihan/admin/{id}/materials`
3. **Create Pre-test** → `/pelatihan/admin/{id}/assessments`
4. **Add Questions** → `/pelatihan/admin/{id}/assessments/{assessmentId}/questions`
5. **Publish Training** → Click "Publish" button
6. **Monitor Enrollments** → `/pelatihan/admin/{id}/enrollments`
7. **Grade Essays** → `/pelatihan/admin/{id}/enrollments/{enrollmentId}/grade`

## Migration Steps

1. **Phase 1: Database Schema**

   ```bash
   # Add schema to packages/db/src/schema.ts
   pnpm db:generate
   pnpm db:migrate
   ```

2. **Phase 2: Backend (API + Services)**
   - Create query functions
   - Create validation schemas
   - Create tRPC routers
   - Create certificate generation service
   - Add permissions to roles

3. **Phase 3: Frontend**
   - Create routes
   - Build components
   - Implement file upload for materials
   - Create assessment taking interface
   - Build certificate viewer

4. **Phase 4: Integration**
   - Connect with order system
   - Integrate document verification
   - Add audit logging
   - Create admin dashboard

## Key Features to Implement

### Must Have (MVP)

- [ ] Training CRUD (create, edit, publish, archive)
- [ ] Training categories management
- [ ] Material upload (PPT, PDF)
- [ ] Pre-test and post-test
- [ ] Multiple choice questions
- [ ] Shopping cart for paid trainings
- [ ] Free training direct enrollment
- [ ] Paid training checkout (integration with order system)
- [ ] User enrollment management
- [ ] Material progress tracking
- [ ] Assessment attempt tracking
- [ ] Certificate generation with QR verification
- [ ] Certificate verification page

### Nice to Have (Future)

- [ ] Video materials with progress tracking
- [ ] Essay questions with manual grading
- [ ] Training bundles/packages
- [ ] Instructor dashboard
- [ ] Discussion forum per training
- [ ] Live sessions/webinars
- [ ] Certificate expiration and renewal
- [ ] Training badges/achievements
- [ ] Email notifications (enrollment, completion, reminders)
- [ ] Training analytics dashboard

## Estimated Timeline

- **Week 1-2:** Database schema, query functions, validation schemas
- **Week 3-4:** tRPC routers, services, permissions
- **Week 5-6:** Frontend routes, components, enrollment flow
- **Week 7-8:** Assessment interface, certificate generation
- **Week 9:** Integration, testing, polish

## Notes

- Follow existing patterns (Effect-based queries, soft deletes, audit logging)
- Use existing services (storage, PDF, document signing)
- Reuse UI components from shadcn/ui
- Ensure mobile-friendly assessment interface
- Consider accessibility for certificates (screen readers, alt text)
- Plan for i18n if certificates need English + Indonesian versions
