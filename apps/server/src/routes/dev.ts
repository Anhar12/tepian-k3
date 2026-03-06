import {
  generateAssignmentLetterPdf,
  generateInvoicePdf,
  generateOfferingLetterHeaderPdf,
  generateOfferingLetterPdf,
  generateSpkPdf,
  generateTagihanPdf,
} from "@tepian-k3/services/pdf";
import { env } from "@/env";
import { Hono } from "hono";
import { createMockData } from "@/utils/mock-data-generator";

const devRouter = new Hono();

const mockData = createMockData({
  numberOfWorksheetItems: 10,
  numberOfOrderItems: 10,
  numberOfAssignments: 5,
  numberOfOperationalCosts: 10,
});

devRouter.use("*", async (c, next) => {
  const isDev = env.NODE_ENV === "development";
  if (!isDev) {
    return c.json({ error: "Not Found" }, 404);
  }

  return next();
});

devRouter.get("/", (c) => {
  return c.json({ message: "Dev route is working!" });
});

devRouter.get("/invoice/:orderId", async (c) => {
  try {
    // Mock data for preview - replace with actual data fetching

    // Or fetch real data if you want
    // const id = c.req.param('id');
    // const invoiceData = await db.query.invoices.findFirst({ where: eq(invoices.id, id) });

    const pdfBuffer = await generateInvoicePdf(mockData);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="invoice-preview.pdf"',
        "Cache-Control": "no-cache", // Always fresh during dev
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return c.json({ error: "Failed to generate PDF" }, 500);
  }
});

devRouter.get("/offering-letter-header/:orderId", async (c) => {
  try {
    // Mock data for preview - replace with actual data fetching

    // Or fetch real data if you want
    // const id = c.req.param('id');
    // const invoiceData = await db.query.invoices.findFirst({ where: eq(invoices.id, id) });

    const pdfBuffer = await generateOfferingLetterHeaderPdf({
      companyName: mockData.order.company.name,
      regencyName: mockData.order.company.regency.name,
      letterNumber: "LET-2024-001",
      adminContact: "021-12345678",
      adminEmail: "test@mail.com",
      referenceDate: new Date().toISOString(),
      referenceNumber: "REF-2024-001",
    });

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="offering-letter-preview.pdf"',
        "Cache-Control": "no-cache", // Always fresh during dev
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return c.json({ error: "Failed to generate PDF" }, 500);
  }
});

devRouter.get("/offering-letter/:orderId", async (c) => {
  try {
    // Mock data for preview - replace with actual data fetching

    // Or fetch real data if you want
    // const id = c.req.param('id');
    // const invoiceData = await db.query.invoices.findFirst({ where: eq(invoices.id, id) });

    const pdfBuffer = await generateOfferingLetterPdf({
      ...mockData,
      letterNumber: "LET-2024-001",
      companyName: mockData.order.company.name,
      companyBankName: mockData.order.company.companyBankName,
      companyBankAccount: mockData.order.company.companyBankAccount,
      companyBankAccountName: mockData.order.company.companyBankAccountName,
    });

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="offering-letter-preview.pdf"',
        "Cache-Control": "no-cache", // Always fresh during dev
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return c.json({ error: "Failed to generate PDF" }, 500);
  }
});

devRouter.get("/assignment-letter/:orderId", async (c) => {
  try {
    // Mock data for preview - replace with actual data fetching

    // Or fetch real data if you want
    // const id = c.req.param('id');
    // const invoiceData = await db.query.invoices.findFirst({ where: eq(invoices.id, id) });

    const pdfBuffer = await generateAssignmentLetterPdf({
      companyName: mockData.order.company.name,
      companyRegency: mockData.order.company.regency.name,
      orderDate: new Date().toISOString(),
      assignmentDateStart: new Date().toISOString(),
      assignmentDateEnd: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      financingSource:
        "Biaya uang harian, transportasi Samarinda – Sangatta (PP), transportasi lokal, dan akomodasi penginapan dibebankan pada RPL 046 PS Balai K3 SMD.",
      letterNumber: "LET-2024-001",
      assignmentLetterNumber: "123",
      assignees: mockData.worksheet.assignments,
    });

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="offering-letter-preview.pdf"',
        "Cache-Control": "no-cache", // Always fresh during dev
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return c.json({ error: "Failed to generate PDF" }, 500);
  }
});

devRouter.get("/spk/:orderId", async (c) => {
  try {
    const pdfBuffer = await generateSpkPdf({
      worksheet: mockData.worksheet,
      companyName: mockData.order.company.name,
      letterNumber: "5.4/028/AS.03/XI/2025",
      agreementDate: new Date().toISOString(),
      companyRepName: "Radhitya",
      companyRepPosition: "HSE",
      companyRepAddress: "Jl. Cipto Mangunkusumo No. 1, Samarinda",
      companyBankName: "Mandiri",
      companyBankAccount: "1480016872783",
      companyBankAccountName: "TRAKINDO UTAMA",
      operationalBankName: "Mandiri",
      operationalBankAccount: "1480024954110",
      operationalBankAccountName: "RPL 046 PS BALAI K3 SMD Utk Ops",
    });

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="spk-preview.pdf"',
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return c.json({ error: "Failed to generate PDF" }, 500);
  }
});

devRouter.get("/tagihan/:orderId", async (c) => {
  try {
    const pdfBuffer = await generateTagihanPdf({
      companyName: mockData.order.company.name,
      companyRegency: mockData.order.company.regency.name,
      letterNumber: "TAG-2024-001",
      referenceNumber: "REF-2024-001",
      referenceDate: new Date().toISOString(),
      billingCode: "820251203334581",
      billingAmount: 500000,
      operationalAmount: 400000,
      billingExpiryDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="tagihan-preview.pdf"',
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return c.json({ error: "Failed to generate PDF" }, 500);
  }
});

export { devRouter };
