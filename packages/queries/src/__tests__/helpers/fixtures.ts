import { 
  users, userCompanies, clusters, parameterCategories, parameters,
  order, worksheets, tools, toolCodes, testing
} from "@tepian-k3/db/schema";
import { v7 as uuidv7 } from "uuid";

/**
 * Creates a mock user and their associated company.
 * Useful for tests involving cart, orders, or any user-specific data.
 * @param mockDb Drizzle DB instance
 * @returns Object containing userId and companyId
 *//**
 * Creates a mock user and an associated company for testing purposes.
 * Ensures that both user and company IDs are generated and valid.
 * 
 * @param {any} mockDb - The Drizzle ORM database instance used for tests.
 * @returns {Promise<{ userId: string, companyId: string }>} The IDs of the created user and company.
 */
export async function createMockUserAndCompany(mockDb: any) {
  const userId = uuidv7();
  const companyId = uuidv7();

  await mockDb.insert(users).values({
    id: userId,
    email: `test-${userId}@example.com`,
    name: "Test User",
    phone: "1234567890",
    address: "Test Address",
    roles: ["user"],
    password: "hash",
  });

  await mockDb.insert(userCompanies).values({
    id: companyId,
    userId,
    name: "Test Company",
    kbliId: uuidv7(),
    address: "Test Address",
    provinceId: uuidv7(),
    districtId: uuidv7(),
    regencyId: uuidv7(),
    villageId: uuidv7(),
    responsibleTestingPerson: "Person",
    responsibleTestingPersonPhone: "123",
    responsibleTestingPersonEmail: "a@a.com",
    headOfCompany: "Head",
    headOfCompanyPosition: "Pos",
    email: "test@test.com",
    companyBankName: "Bank",
    companyBankAccount: "123",
    companyBankAccountName: "Account",
    companyPictureUrl: "url",
    companyPictureName: "name",
  });

  return { userId, companyId };
}

/**
 * Creates a mock cluster and a parameter category within it.
 * @param mockDb Drizzle DB instance
 * @returns Object containing clusterId and categoryId
 *//**
 * Creates a mock cluster and its default parameter category.
 * Essential for testing parameters that require a valid category relationship.
 * 
 * @param {any} mockDb - The Drizzle ORM database instance used for tests.
 * @returns {Promise<{ clusterId: string, categoryId: string }>} The generated cluster and category IDs.
 */
export async function createMockCluster(mockDb: any) {
  const clusterId = uuidv7();
  const categoryId = uuidv7();
  
  await mockDb.insert(clusters).values({
    id: clusterId,
    name: `Test Cluster ${clusterId}`,
    code: `TC-${clusterId.substring(0, 4)}`,
  });

  await mockDb.insert(parameterCategories).values({
    id: categoryId,
    clusterId,
    name: `Test Category ${categoryId}`,
    code: `CAT-${categoryId.substring(0, 4)}`,
  });
  
  return { clusterId, categoryId };
}

/**
 * Creates a mock parameter belonging to a given category.
 * @param mockDb Drizzle DB instance
 * @param categoryId ID of the category this parameter belongs to
 * @returns Object containing parameterId
 */
export async function createMockParameter(mockDb: any, categoryId?: string) {
  if (!categoryId) {
    const { categoryId: newCategoryId } = await createMockCluster(mockDb);
    categoryId = newCategoryId;
  }
  const parameterId = uuidv7();
  
  await mockDb.insert(parameters).values({
    id: parameterId,
    parameterCategoryId: categoryId,
    name: `Test Parameter ${parameterId}`,
    price: 1000,
    unit: "mg/L",
    reference: "ISO 9001",
  });
  
  return { parameterId };
}

/**
 * Creates a mock order and an associated worksheet.
 * @param mockDb Drizzle DB instance
 * @param userId ID of the user creating the order
 * @param companyId ID of the company
 * @returns Object containing orderId and worksheetId
 */
export async function createMockOrderAndWorksheet(mockDb: any, userId: string, companyId: string) {
  const orderId = uuidv7();
  const worksheetId = uuidv7();
  const testingId = uuidv7();

  await mockDb.insert(order).values({
    id: orderId,
    orderNumber: `ORD-${orderId.substring(0, 8)}`,
    userId,
    companyId,
    totalAmount: "100",
    status: "pending",
    approvalStatus: "pending",
    paymentStatus: "unpaid",
  });

  await mockDb.insert(worksheets).values({
    id: worksheetId,
    orderId,
    status: "draft",
    createdBy: userId,
  });

  await mockDb.insert(testing).values({
    id: testingId,
    orderId,
    testingNumber: `TEST-${testingId.substring(0, 8)}`,
    status: "start_testing",
    worksheetId,
    userId,
    companyId,
    testingType: uuidv7(),
  });

  return { orderId, worksheetId, testingId };
}

/**
 * Creates a mock tool and its tool code.
 * @param mockDb Drizzle DB instance
 * @returns Object containing toolCodeId and toolId
 */
export async function createMockTool(mockDb: any) {
  const toolCodeId = uuidv7();
  const toolId = uuidv7();

  await mockDb.insert(toolCodes).values({
    id: toolCodeId,
    code: `TC-${toolCodeId.substring(0, 6)}`,
    name: "Test Tool Code",
  });

  await mockDb.insert(tools).values({
    id: toolId,
    toolCodeId,
    toolUniqueCode: `T-${toolId.substring(0, 6)}`,
    toolName: "Test Tool",
    brand: "Test Merk",
    type: "Test Type",
    serialNumber: `SN-${toolId.substring(0, 6)}`,
    availability: "ready",
    condition: "baik",
  });

  return { toolCodeId, toolId };
}
