import { db } from "../client";
import {
  order,
  orderItem,
  orderStatusHistory,
  worksheets,
  worksheetItems,
  worksheetTools,
  worksheetChemicalMaterials,
  users,
  userCompanies,
  userCompanyTestingLocation,
  parameters,
  parameterTools,
  parameterChemicalMaterials,
} from "../schema";
import { eq, inArray } from "drizzle-orm";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@tepian-k3/constants";

/**
 * Seeds 3 test orders in different workflow stages for development only.
 *
 * - ORD-SEED-001 : kaji_ulang            — no worksheet (new order under review)
 * - ORD-SEED-002 : menunggu_spt          — worksheet draft  (ready for kaji_ulang to fill)
 * - ORD-SEED-003 : proses_pengambilan    — worksheet pending_verification (submitted for review)
 *
 * Orders 2 & 3 are populated with worksheetItems, worksheetTools, and
 * worksheetChemicalMaterials drawn from the seeded parameters/tools/chemical-materials.
 *
 * Each order also gets a full `orderStatusHistory` backfill — one entry per
 * status in `ORDER_STATUS_FLOW` up to and including the current status, with
 * timestamps spaced one day apart — so the web order timeline renders a date
 * for every completed step instead of "-".
 *
 * @param isProduction - When true, this function is a no-op
 */
export async function seedOrders(isProduction: boolean) {
  if (isProduction) return;

  console.log("📦 Syncing seed orders...");

  // ── Prerequisites ──────────────────────────────────────────────────────────

  const userRecord = await db.query.users.findFirst({
    where: eq(users.email, "user@mail.com"),
  });
  if (!userRecord) {
    console.warn("⚠️  Test user 'user@mail.com' not found, skipping orders...");
    return;
  }

  const adminRecord = await db.query.users.findFirst({
    where: eq(users.email, "admin@mail.com"),
  });

  const company = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.userId, userRecord.id),
  });
  if (!company) {
    console.warn("⚠️  No company found for test user, skipping orders...");
    return;
  }

  const location = await db.query.userCompanyTestingLocation.findFirst({
    where: eq(userCompanyTestingLocation.userCompanyId, company.id),
  });
  if (!location) {
    console.warn("⚠️  No testing location found, skipping orders...");
    return;
  }

  const employee = await db.query.employees.findFirst();
  if (!employee) {
    console.warn("⚠️  No employee found, skipping orders...");
    return;
  }

  // ── Find parameters that have BOTH tools AND chemical materials ────────────

  const paramToolRows = await db
    .select({
      parameterId: parameterTools.parameterId,
      toolId: parameterTools.toolId,
    })
    .from(parameterTools);

  const paramChemRows = await db
    .select({
      parameterId: parameterChemicalMaterials.parameterId,
      chemicalMaterialId: parameterChemicalMaterials.chemicalMaterialId,
    })
    .from(parameterChemicalMaterials);

  const paramIdsWithTools = new Set(paramToolRows.map((r) => r.parameterId));
  const paramIdsWithChem = new Set(paramChemRows.map((r) => r.parameterId));
  const paramIdsWithBoth = [...paramIdsWithTools].filter((id) =>
    paramIdsWithChem.has(id),
  );

  if (paramIdsWithBoth.length === 0) {
    console.warn(
      "⚠️  No parameters with both tools AND chemical materials found, skipping orders...",
    );
    return;
  }

  const qualifiedParams = await db.query.parameters.findMany({
    where: inArray(parameters.id, paramIdsWithBoth.slice(0, 5)),
    limit: 3,
  });

  if (qualifiedParams.length === 0) {
    console.warn("⚠️  Could not load qualified parameters, skipping orders...");
    return;
  }

  const changedBy = adminRecord?.id ?? userRecord.id;

  // ── Seed definitions ───────────────────────────────────────────────────────

  const SEED_ORDERS = [
    {
      orderNumber: "ORD-SEED-001",
      status: "kaji_ulang" as const,
      approvalStatus: "pending" as const,
      paymentStatus: "unpaid" as const,
      withWorksheet: false,
      worksheetStatus: undefined,
      label: "Order dalam proses kaji ulang",
    },
    {
      orderNumber: "ORD-SEED-002",
      status: "menunggu_penerbitan_spt_jadwal" as const,
      approvalStatus: "approved" as const,
      paymentStatus: "paid" as const,
      withWorksheet: true,
      worksheetStatus: "draft" as const,
      label: "Order siap worksheet (draft)",
    },
    {
      orderNumber: "ORD-SEED-003",
      status: "proses_pengambilan_sampel" as const,
      approvalStatus: "approved" as const,
      paymentStatus: "paid" as const,
      withWorksheet: true,
      worksheetStatus: "pending_verification" as const,
      label: "Order worksheet diajukan verifikasi",
    },
  ];

  // Check which seed orders already exist
  const existingOrders = await db.query.order.findMany({
    where: inArray(
      order.orderNumber,
      SEED_ORDERS.map((o) => o.orderNumber),
    ),
  });
  const existingOrderNumbers = new Set(
    existingOrders.map((o) => o.orderNumber),
  );

  // ── Create orders ──────────────────────────────────────────────────────────

  for (const seedOrder of SEED_ORDERS) {
    if (existingOrderNumbers.has(seedOrder.orderNumber)) {
      console.log(`   ✓  Order already exists: ${seedOrder.orderNumber}`);
      continue;
    }

    const totalAmount = qualifiedParams.reduce((sum, p) => sum + p.price, 0);

    // Create order
    const [newOrder] = await db
      .insert(order)
      .values({
        orderNumber: seedOrder.orderNumber,
        userId: userRecord.id,
        companyId: company.id,
        status: seedOrder.status,
        approvalStatus: seedOrder.approvalStatus,
        paymentStatus: seedOrder.paymentStatus,
        totalAmount,
        approvedAt:
          seedOrder.approvalStatus === "approved"
            ? new Date().toISOString()
            : null,
        paidAt:
          seedOrder.paymentStatus === "paid" ? new Date().toISOString() : null,
        customerNote: seedOrder.label,
      })
      .returning();

    if (!newOrder) continue;

    // Create order items — one per qualified parameter
    const orderItemRecords = [];
    for (const param of qualifiedParams) {
      const [item] = await db
        .insert(orderItem)
        .values({
          orderId: newOrder.id,
          parameterId: param.id,
          locationId: location.id,
          quantity: 1,
          price: param.price,
          subTotal: param.price,
        })
        .returning();
      if (item) orderItemRecords.push(item);
    }

    // Status history — backfill an entry for every status in the flow up to and
    // including the current one, so the web timeline shows dates for each
    // completed step instead of "-".
    const currentFlowIndex = ORDER_STATUS_FLOW.indexOf(
      seedOrder.status as OrderStatus,
    );
    const timelineStatuses: OrderStatus[] =
      currentFlowIndex >= 0
        ? ORDER_STATUS_FLOW.slice(0, currentFlowIndex + 1)
        : [seedOrder.status as OrderStatus];

    // Space each step one day apart, ending "now" for the current status.
    const DAY_MS = 24 * 60 * 60 * 1000;
    const baseTime = Date.now() - (timelineStatuses.length - 1) * DAY_MS;

    for (const [stepIndex, stepStatus] of timelineStatuses.entries()) {
      const isCurrent = stepIndex === timelineStatuses.length - 1;
      await db.insert(orderStatusHistory).values({
        orderId: newOrder.id,
        status: stepStatus,
        changedBy,
        note: isCurrent
          ? `[seed] ${seedOrder.label}`
          : `[seed] ${ORDER_STATUS_LABELS[stepStatus]}`,
        createdAt: new Date(baseTime + stepIndex * DAY_MS).toISOString(),
      });
    }

    console.log(
      `   ➕ Created order: ${seedOrder.orderNumber} — ${seedOrder.status}`,
    );

    if (!seedOrder.withWorksheet || !seedOrder.worksheetStatus) continue;

    // ── Worksheet ────────────────────────────────────────────────────────────

    const [worksheet] = await db
      .insert(worksheets)
      .values({
        orderId: newOrder.id,
        status: seedOrder.worksheetStatus,
        estimatedAmountOfMembers: 3,
        estimatedAmountOfDays: 2,
        createdBy: userRecord.id,
      })
      .returning();

    if (!worksheet) continue;

    // Worksheet items — mirror order items
    for (const item of orderItemRecords) {
      await db.insert(worksheetItems).values({
        worksheetId: worksheet.id,
        parameterId: item.parameterId!,
        locationId: item.locationId!,
        quantity: item.quantity,
        isReady: seedOrder.worksheetStatus === "pending_verification",
      });
    }

    // Worksheet tools — from the first qualified parameter's tool assignments
    const toolsForFirstParam = paramToolRows
      .filter((r) => r.parameterId === qualifiedParams[0]!.id)
      .slice(0, 3);

    for (const toolRow of toolsForFirstParam) {
      await db.insert(worksheetTools).values({
        worksheetId: worksheet.id,
        toolId: toolRow.toolId,
        borrowedBy: employee.id,
      });
    }

    // Worksheet chemical materials — from the first qualified parameter
    const chemsForFirstParam = paramChemRows
      .filter((r) => r.parameterId === qualifiedParams[0]!.id)
      .slice(0, 3);

    for (const chemRow of chemsForFirstParam) {
      await db.insert(worksheetChemicalMaterials).values({
        worksheetId: worksheet.id,
        chemicalMaterialId: chemRow.chemicalMaterialId,
        required: 10,
        requiredUnit: "gram",
      });
    }

    console.log(`      ➕ Created worksheet (${seedOrder.worksheetStatus})`);
  }

  console.log("✅ Seed orders synced");
}
