import { faker, Faker, id_ID, type LocaleDefinition } from "@faker-js/faker";

interface MockDataGeneratorOptions {
  // Order options
  orderStatus?: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  approvalStatus?: "pending" | "approved" | "rejected";
  paymentStatus?: "pending" | "paid" | "rejected";

  // Worksheet options
  worksheetStatus?: "draft" | "in_progress" | "completed" | "cancelled";
  numberOfWorksheetItems?: number;
  numberOfAssignments?: number;
  numberOfOperationalCosts?: number;

  // Items options
  numberOfOrderItems?: number;

  // Company options
  companyName?: string;

  // Misc
  locale?: LocaleDefinition[];
}

export class MockDataGenerator {
  faker: Faker;

  constructor(private options: MockDataGeneratorOptions = {}) {
    if (options.locale) {
      this.faker = new Faker({ locale: [...options.locale, id_ID] });
    } else {
      this.faker = faker;
    }
  }

  generateId(prefix: string = ""): string {
    return prefix
      ? `${prefix}-${this.faker.string.uuid()}`
      : this.faker.string.uuid();
  }

  generatePhone(countryCode: string = "+62"): string {
    const number = this.faker.string.numeric(10);
    return `${countryCode} ${number.slice(0, 3)} ${number.slice(3, 7)} ${number.slice(7)}`;
  }

  generateCluster() {
    return {
      id: this.generateId("cluster"),
      name: this.faker.helpers.arrayElement([
        "Chemical Analysis",
        "Biological Testing",
        "Physical Testing",
        "Environmental Testing",
        "Quality Control",
      ]),
      deletedAt: null,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      description: this.faker.lorem.sentence(),
    };
  }

  generateCategory(cluster: ReturnType<typeof this.generateCluster>) {
    return {
      id: this.generateId("cat"),
      name: this.faker.helpers.arrayElement([
        "Water Quality",
        "Air Quality",
        "Soil Analysis",
        "Heavy Metals",
        "Microbiological",
      ]),
      deletedAt: null,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      description: this.faker.lorem.sentence(),
      clusterId: cluster.id,
      cluster,
    };
  }

  generateParameter(category: ReturnType<typeof this.generateCategory>) {
    return {
      id: this.generateId("param"),
      name: this.faker.helpers.arrayElement([
        "pH Level",
        "Dissolved Oxygen",
        "BOD",
        "COD",
        "Turbidity",
        "Temperature",
        "Conductivity",
      ]),
      deletedAt: null,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      parameterCategoryId: category.id,
      reference: this.faker.string.alphanumeric(8).toUpperCase(),
      price: this.faker.number.int({ min: 50000, max: 500000 }),
      unit: this.faker.helpers.arrayElement([
        "mg/L",
        "µg/L",
        "ppm",
        "NTU",
        "°C",
        "µS/cm",
        "kg",
      ]),
      category,
    };
  }

  generateRegency() {
    return {
      id: this.generateId("regency"),
      name: this.faker.location.county(),
      deletedAt: null,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      provinceId: this.generateId("province"),
      oldId: this.faker.number.int({ min: 1000, max: 9999 }),
      oldProvinceId: this.faker.number.int({ min: 1000, max: 9999 }),
    };
  }

  generateDistrict(regency: ReturnType<typeof this.generateRegency>) {
    return {
      id: this.generateId("district"),
      name: this.faker.location.city(),
      deletedAt: null,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      oldId: this.faker.number.int({ min: 1000, max: 9999 }),
      oldRegencyId: this.faker.number.int({ min: 1000, max: 9999 }),
      regencyId: regency.id,
    };
  }

  generateLocation(
    userId: string,
    companyId: string,
    district: ReturnType<typeof this.generateDistrict>,
    regency: ReturnType<typeof this.generateRegency>,
  ) {
    return {
      id: this.generateId("location"),
      name: this.faker.location.streetAddress(),
      deletedAt: null,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      userId,
      districtId: district.id,
      regencyId: regency.id,
      userCompanyId: companyId,
      district,
      regency,
    };
  }

  generateCompany() {
    const regency = this.generateRegency();
    return {
      id: this.generateId("company"),
      name: this.options.companyName || this.faker.company.name(),
      address: this.faker.location.streetAddress(true),
      responsibleTestingPersonPhone: this.generatePhone(),
      regency: {
        id: regency.id,
        name: regency.name,
      },
    };
  }

  generateOrderItem(
    orderId: string,
    parameter: ReturnType<typeof this.generateParameter>,
  ) {
    const quantity = this.faker.number.int({ min: 1, max: 10 });
    const price = parameter.price;
    return {
      id: this.generateId("item"),
      quantity,
      price,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      deletedAt: null,
      parameter,
      parameterId: parameter.id,
      locationId: this.generateId("location"),
      orderId,
      subTotal: quantity * price,
    };
  }

  generateUser() {
    const firstName = this.faker.person.firstName();
    const lastName = this.faker.person.lastName();
    const email = this.faker.internet.email({ firstName, lastName });

    return {
      id: this.generateId("user"),
      name: `${firstName} ${lastName}`,
      password: this.faker.internet.password(),
      email,
      address: this.faker.location.streetAddress(true),
      phone: this.generatePhone(),
      emailVerified: this.faker.datatype.boolean(),
      emailVerifiedAt: this.faker.date.past().toISOString(),
      profilePictureUrl: this.faker.image.avatar(),
      deletedAt: null,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
    };
  }

  generatePosition() {
    return {
      id: this.generateId("position"),
      name: this.faker.helpers.arrayElement([
        "Supervisor",
        "Analyst",
        "Technician",
        "Manager",
        "Coordinator",
      ]),
      deletedAt: null,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      description: this.faker.lorem.sentence(),
    };
  }

  generateEmployee(userId: string) {
    const position = this.generatePosition();
    const user = this.generateUser();
    user.id = userId;

    return {
      id: this.generateId("emp"),
      name: user.name,
      email: user.email,
      deletedAt: null,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      userId: user.id,
      status: this.faker.helpers.arrayElement([
        "siap",
        "cuti",
        "sakit",
        "dinas",
      ]),
      positionId: position.id,
      nip: this.faker.string.numeric(10),
      type: this.faker.helpers.arrayElement([
        "I/a",
        "I/b",
        "II/a",
        "II/b",
        "III/a",
        "III/b",
        "IV/a",
      ]),
      user,
      position,
    };
  }

  generateWorksheetItem(
    worksheetId: string,
    parameter: ReturnType<typeof this.generateParameter>,
    location: ReturnType<typeof this.generateLocation>,
  ) {
    return {
      id: this.generateId("ws-item"),
      deletedAt: null,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      note: this.faker.datatype.boolean() ? this.faker.lorem.sentence() : null,
      parameterId: parameter.id,
      locationId: location.id,
      quantity: this.faker.number.int({ min: 1, max: 5 }),
      worksheetId,
      isReady: this.faker.datatype.boolean(),
      location,
      parameter,
    };
  }

  generateAssignment(worksheetId: string, userId: string) {
    const employee = this.generateEmployee(this.generateId("user"));

    return {
      id: this.generateId("assign"),
      deletedAt: null,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      worksheetId,
      employeeId: employee.id,
      assignedBy: userId,
      employee,
    };
  }

  generateOperationalCost(worksheetId: string, sortOrder: number) {
    const days = this.faker.number.int({ min: 1, max: 7 });
    const unitCount = this.faker.number.int({ min: 1, max: 5 });
    const unitCost = this.faker.number.int({ min: 25000, max: 200000 });

    return {
      id: this.generateId("opcost"),
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      deletedAt: null,
      days,
      item: this.faker.helpers.arrayElement([
        "Transportasi",
        "Akomodasi",
        "Konsumsi",
        "Peralatan",
        "Lain-lain",
      ]),
      note: this.faker.lorem.sentence(),
      sortOrder,
      unitCost,
      worksheetId,
      unitCount,
    };
  }

  generateOrder(): any {
    const userId = this.generateId("user");
    const company = this.generateCompany();
    const orderId = this.generateId("order");
    const orderNumber = `ORD-${this.faker.date.recent().getFullYear()}-${this.faker.string.numeric(4)}`;

    const numberOfItems =
      this.options.numberOfOrderItems ||
      this.faker.number.int({ min: 1, max: 5 });
    const items = [];
    let totalAmount = 0;

    for (let i = 0; i < numberOfItems; i++) {
      const cluster = this.generateCluster();
      const category = this.generateCategory(cluster);
      const parameter = this.generateParameter(category);
      const item = this.generateOrderItem(orderId, parameter);
      items.push(item);
      totalAmount += item.subTotal;
    }

    return {
      id: orderId,
      orderNumber,
      deletedAt: null,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      userId,
      status:
        this.options.orderStatus ||
        this.faker.helpers.arrayElement([
          "pending",
          "approved",
          "completed",
          "cancelled",
        ]),
      statusHistory: [],
      approvedAt: this.faker.date.past().toISOString(),
      company,
      items,
      revisionNotes: this.faker.lorem.sentence(),
      cancelledAt: null,
      companyId: company.id,
      totalAmount,
      approvalStatus:
        this.options.approvalStatus ||
        this.faker.helpers.arrayElement(["pending", "approved", "rejected"]),
      approvalRejectReason: null,
      paymentStatus:
        this.options.paymentStatus ||
        this.faker.helpers.arrayElement(["pending", "paid", "rejected"]),
      paymentRejectedReason: null,
      revisionCount: this.faker.number.int({ min: 0, max: 5 }),
      coverTransportationIncluded: this.faker.datatype.boolean(),
      coverAccommodationIncluded: this.faker.datatype.boolean(),
      paidAt: null,
      completedAt: null,
    };
  }

  generateWorksheet(order: any): any {
    const worksheetId = this.generateId("worksheet");
    const userId = order.userId;

    // Generate items
    const numberOfWorksheetItems =
      this.options.numberOfWorksheetItems ||
      this.faker.number.int({ min: 3, max: 20 });
    const items = [];

    const regency = this.generateRegency();
    const district = this.generateDistrict(regency);
    const location = this.generateLocation(
      userId,
      order.companyId,
      district,
      regency,
    );

    const cluster = this.generateCluster();
    const category = this.generateCategory(cluster);
    const parameter = this.generateParameter(category);

    for (let i = 0; i < numberOfWorksheetItems; i++) {
      items.push(this.generateWorksheetItem(worksheetId, parameter, location));
    }

    // Generate assignments
    const numberOfAssignments =
      this.options.numberOfAssignments ||
      this.faker.number.int({ min: 1, max: 3 });
    const assignments = [];
    for (let i = 0; i < numberOfAssignments; i++) {
      assignments.push(this.generateAssignment(worksheetId, userId));
    }

    // Generate operational costs
    const numberOfOperationalCosts =
      this.options.numberOfOperationalCosts ||
      this.faker.number.int({ min: 2, max: 5 });
    const operationalCosts = [];
    for (let i = 0; i < numberOfOperationalCosts; i++) {
      operationalCosts.push(this.generateOperationalCost(worksheetId, i + 1));
    }

    return {
      id: worksheetId,
      deletedAt: null,
      createdAt: this.faker.date.past().toISOString(),
      updatedAt: null,
      note: this.faker.datatype.boolean() ? this.faker.lorem.sentence() : null,
      status:
        this.options.worksheetStatus ||
        this.faker.helpers.arrayElement(["draft", "in_progress", "completed"]),
      coverTransportationIncluded: this.faker.datatype.boolean(),
      coverAccommodationIncluded: this.faker.datatype.boolean(),
      orderId: order.id,
      startDate: this.faker.date.future().toISOString(),
      endDate: this.faker.date.future().toISOString(),
      mainSupervisorId: assignments[0]?.employeeId || null,
      accompanyingSupervisorId: assignments[1]?.employeeId || null,
      result: null,
      createdBy: userId,
      estimatedAmountOfMembers: this.faker.number.int({ min: 1, max: 5 }),
      estimatedAmountOfDays: this.faker.number.int({ min: 1, max: 10 }),
      order: {
        ...order,
        company: {
          id: order.company.id,
          name: order.company.name,
        },
        items: order.items.map((item: any) => {
          const itemLocation = this.generateLocation(
            userId,
            order.companyId,
            district,
            regency,
          );
          return {
            ...item,
            location: itemLocation,
          };
        }),
      },
      items,
      mainSupervisor: assignments[0]?.employee || null,
      accompanyingSupervisor: assignments[1]?.employee || null,
      assignments,
      operationalCosts,
    };
  }

  generateMockData() {
    const order = this.generateOrder();
    const worksheet = this.generateWorksheet(order);
    const invoiceNumber = `INV-${this.faker.date.recent().getFullYear()}-${this.faker.string.numeric(4)}`;
    const dueDate = this.faker.date.future().toISOString().split("T")[0];

    return {
      order,
      worksheet,
      invoiceNumber,
      dueDate,
    };
  }

  // Helper method to generate multiple mock data sets
  generateMultiple(count: number) {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(this.generateMockData());
    }
    return results;
  }
}

// Usage examples
export function createMockData(options?: MockDataGeneratorOptions) {
  const generator = new MockDataGenerator(options);
  return generator.generateMockData();
}

export function createMultipleMockData(
  count: number,
  options?: MockDataGeneratorOptions,
) {
  const generator = new MockDataGenerator(options);
  return generator.generateMultiple(count);
}

// Example usage:
// const mockData = createMockData();
// const multipleMockData = createMultipleMockData(5, { orderStatus: 'approved', numberOfWorksheetItems: 10 });
