import {
  generateAssignmentLetterPdf,
  generateInvoicePdf,
  generateOfferingLetterHeaderPdf,
  generateOfferingLetterPdf,
} from "@tepian-k3/services/pdf";
import type { OrderWithCompanyAndItems } from "@tepian-k3/types/order.types";
import type { WorksheetTransactionDetail } from "@tepian-k3/types/worksheet.types";
import { env } from "env";
import { Hono } from "hono";

const devRouter = new Hono();

const mockOrder = {
  id: "order-mock-id",
  orderNumber: "ORD-2024-001",
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: null,
  userId: "user-mock-id",
  status: "pending",
  statusHistory: [],
  approvedAt: new Date().toISOString(),
  company: {
    id: "company-mock-id",
    name: "Acme Corp",
    address: "123 Main St, City, State 12345",
    responsibleTestingPersonPhone: "+62 812 3456 7890",
    regency: {
      id: "regency-1",
      name: "Test Regency",
    },
  },
  items: [
    {
      id: "item-1",
      quantity: 2,
      price: 100000,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      deletedAt: null,
      parameter: {
        id: "param-1",
        name: "Test Parameter",
        category: {
          id: "cat-1",
          name: "Test Category",
          cluster: {
            id: "cluster-1",
            name: "Test Cluster",
          },
        },
        unit: "kg",
      },
      parameterId: "param-1",
      locationId: "location-1",
      orderId: "order-mock-id",
      subTotal: 200000,
    },
    {
      id: "item-2",
      quantity: 1,
      price: 300000,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      deletedAt: null,
      parameter: {
        id: "param-2",
        name: "Another Parameter",
        category: {
          id: "cat-2",
          name: "Another Category",
          cluster: {
            id: "cluster-1",
            name: "Test Cluster",
          },
        },
        unit: "liters",
      },
      parameterId: "param-2",
      locationId: "location-2",
      orderId: "order-mock-id",
      subTotal: 300000,
    },
  ],
  revisionNotes: "Initial revision",
  cancelledAt: null,
  companyId: "company-mock-id",
  totalAmount: 500000,
  approvalStatus: "pending",
  approvalRejectReason: null,
  paymentStatus: "rejected",
  paymentRejectedReason: null,
  revisionCount: 0,
  coverTransportationIncluded: null,
  coverAccommodationIncluded: null,
  paidAt: null,
  completedAt: null,
} satisfies OrderWithCompanyAndItems;

const mockData = {
  order: mockOrder,
  worksheet: {
    id: "worksheet-mock-id",
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    note: null,
    status: "in_progress",
    coverTransportationIncluded: null,
    coverAccommodationIncluded: null,
    orderId: "order-mock-id",
    startDate: null,
    endDate: null,
    mainSupervisorId: null,
    accompanyingSupervisorId: null,
    result: null,
    createdBy: "user-mock-id",
    order: {
      id: "order-mock-id",
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      userId: "user-mock-id",
      status: "pending",
      companyId: "company-mock-id",
      orderNumber: "ORD-2024-001",
      totalAmount: 500000,
      approvalStatus: "pending",
      approvalRejectReason: null,
      paymentStatus: "rejected",
      paymentRejectedReason: null,
      revisionCount: 0,
      revisionNotes: null,
      coverTransportationIncluded: null,
      coverAccommodationIncluded: null,
      approvedAt: null,
      paidAt: null,
      completedAt: null,
      cancelledAt: null,
      company: {
        id: "company-mock-id",
        name: "Acme Corp",
        email: "contact@acmecorp.com",
        address: "123 Main St, City, State 12345",
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        userId: "user-mock-id",
        kbliId: "kbli-001",
        maleWorkers: 50,
        femaleWorkers: 30,
        healthFacilityAvailable: true,
        provinceId: "province-1",
        districtId: "district-1",
        regencyId: "regency-1",
        villageId: "village-1",
        responsibleTestingPerson: "John Doe",
        responsibleTestingPersonPhone: "+62 812 3456 7890",
        responsibleTestingPersonEmail: "john.doe@acmecorp.com",
        wlkpStatus: true,
        wlkp: "WLKP-2024-001",
        companyPictureUrl: "https://example.com/company-logo.png",
      },
      items: [
        {
          id: "item-3",
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          price: 100000,
          parameterId: "param-3",
          locationId: "location-3",
          quantity: 3,
          orderId: "order-mock-id",
          subTotal: 300000,
          location: {
            id: "location-3",
            name: "Test Location",
            deletedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            userId: "user-mock-id",
            districtId: "district-2",
            regencyId: "regency-2",
            userCompanyId: "company-mock-id",
            district: {
              id: "district-2",
              name: "Sample District",
              deletedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: null,
              oldId: 1001,
              oldRegencyId: 2001,
              regencyId: "regency-2",
            },
            regency: {
              id: "regency-2",
              name: "Sample Regency",
              deletedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: null,
              provinceId: "province-2",
              oldId: 2001,
              oldProvinceId: 3001,
            },
          },
          parameter: {
            id: "param-3",
            name: "Sample Parameter",
            deletedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            parameterCategoryId: "cat-3",
            reference: "REF-001",
            price: 100,
            unit: "mg/L",
            category: {
              id: "cat-3",
              name: "Sample Category",
              deletedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: null,
              description: "A sample testing category",
              clusterId: "cluster-2",
              cluster: {
                id: "cluster-2",
                name: "Sample Cluster",
                deletedAt: null,
                createdAt: new Date().toISOString(),
                updatedAt: null,
                description: "A sample testing cluster",
              },
            },
          },
        },
      ],
    },
    items: [
      {
        id: "ws-item-1",
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        note: null,
        parameterId: "param-3",
        locationId: "location-3",
        quantity: 1,
        worksheetId: "",
        value: 3,
        isReady: true,
        location: {
          id: "location-3",
          name: "Test Location",
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          userId: "user-mock-id",
          districtId: "district-2",
          regencyId: "regency-2",
          userCompanyId: "company-mock-id",
          district: {
            id: "district-2",
            name: "Sample District",
            deletedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            oldId: 1001,
            oldRegencyId: 2001,
            regencyId: "regency-2",
          },
          regency: {
            id: "regency-2",
            name: "Sample Regency",
            deletedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            provinceId: "province-2",
            oldId: 2001,
            oldProvinceId: 3001,
          },
        },
        parameter: {
          id: "param-3",
          name: "Sample Parameter",
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          parameterCategoryId: "cat-3",
          reference: "REF-001",
          price: 100000,
          unit: "mg/L",
          category: {
            id: "cat-3",
            name: "Sample Category",
            deletedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            description: "A sample testing category",
            clusterId: "cluster-2",
            cluster: {
              id: "cluster-2",
              name: "Sample Cluster",
              deletedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: null,
              description: "A sample testing cluster",
            },
          },
        },
      },
      {
        id: "ws-item-2",
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        note: null,
        parameterId: "param-3",
        locationId: "location-3",
        quantity: 1,
        worksheetId: "",
        value: 2,
        isReady: true,
        location: {
          id: "location-3",
          name: "Test Location",
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          userId: "user-mock-id",
          districtId: "district-2",
          regencyId: "regency-2",
          userCompanyId: "company-mock-id",
          district: {
            id: "district-2",
            name: "Sample District",
            deletedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            oldId: 1001,
            oldRegencyId: 2001,
            regencyId: "regency-2",
          },
          regency: {
            id: "regency-2",
            name: "Sample Regency",
            deletedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            provinceId: "province-2",
            oldId: 2001,
            oldProvinceId: 3001,
          },
        },
        parameter: {
          id: "param-3",
          name: "Sample Parameter",
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          parameterCategoryId: "cat-3",
          reference: "REF-001",
          price: 100000,
          unit: "mg/L",
          category: {
            id: "cat-3",
            name: "Sample Category",
            deletedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            description: "A sample testing category",
            clusterId: "cluster-2",
            cluster: {
              id: "cluster-2",
              name: "Sample Cluster",
              deletedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: null,
              description: "A sample testing cluster",
            },
          },
        },
      },
    ],
    mainSupervisor: null,
    accompanyingSupervisor: null,
    assignments: [
      {
        id: "assign-1",
        deletedAt: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: null,
        worksheetId: "worksheet-mock-id",
        employeeId: "emp-1",
        assignedBy: "user-mock-id",
        employee: {
          id: "",
          name: "Supervisor Mock",
          email: "supervisor@mail.com",
          deletedAt: null,
          createdAt: "",
          updatedAt: null,
          userId: "",
          status: "siap",
          positionId: "",
          nip: "1234567890",
          type: "III/a",
          user: {
            id: "user-mock-id",
            name: "user-mock",
            password: "hashed-password",
            email: "user@mail.com",
            address: "user address",
            phone: "+62 812 3456 7890",
            emailVerified: true,
            emailVerifiedAt: null,
            profilePictureUrl: null,
            deletedAt: null,
            createdAt: "",
            updatedAt: null,
          },
          position: {
            id: "position-1",
            name: "Supervisor",
            deletedAt: null,
            createdAt: "",
            updatedAt: null,
            description: "Responsible for supervising tests",
          },
        },
      },
    ],
    operationalCosts: [
      {
        id: "opcost-1",
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
        days: 2,
        item: "Transportasi",
        note: "Biaya transportasi ke lokasi",
        sortOrder: 1,
        unitCost: 50000,
        worksheetId: "worksheet-mock-id",
        unitCount: 2,
      },
      {
        id: "opcost-2",
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
        days: 2,
        item: "Akomodasi",
        note: "Biaya akomodasi selama di lokasi",
        sortOrder: 2,
        unitCost: 50000,
        worksheetId: "worksheet-mock-id",
        unitCount: 2,
      },
    ],
  } satisfies WorksheetTransactionDetail,
  invoiceNumber: "INV-2024-001",
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  // Add other optional fields if needed (logoUrl, qrCodeDataURL, verificationURL)
};

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

export { devRouter };
