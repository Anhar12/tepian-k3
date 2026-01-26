import { createCallerFactory, createTRPCRouter } from ".";
import { auditRouter } from "./routers/audit";
import { authRouter } from "./routers/auth";
import { cartRouter } from "./routers/cart";
import { chemicalMaterialRouter } from "./routers/chemical-material";
import { clusterRouter } from "./routers/cluster";
import { districtRouter } from "./routers/district";
import { documentRouter } from "./routers/document";
import { employeeRouter } from "./routers/employee";
import { eventRouter } from "./routers/event";
import { generateDocumentRouter } from "./routers/generate-document";
import { kbliRouter } from "./routers/kbli";
import { notificationsRouter } from "./routers/notifications";
import { orderRouter } from "./routers/order";
import { parameterRouter } from "./routers/parameter";
import { parameterCategoriesRouter } from "./routers/parameter-categories";
import { parameterChemicalMaterialRouter } from "./routers/parameter-chemical-material";
import { parameterToolRouter } from "./routers/parameter-tool";
import { permissionRouters } from "./routers/permission";
import { positionRouter } from "./routers/position";
import { provinceRouter } from "./routers/province";
import { regencyRouter } from "./routers/regency";
import { roleRouters } from "./routers/role";
import { surveyRouter } from "./routers/survey";
import { testRouter } from "./routers/test";
import { testingRouter } from "./routers/testing";
import { toolRouter } from "./routers/tool";
import { userRouter } from "./routers/user";
import { userCompanyRouter } from "./routers/user-company";
import { userCompanyTestingLocationRouter } from "./routers/user-company-testing-location";
import { villageRouter } from "./routers/village";
import { worksheetRouter } from "./routers/worksheet";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  role: roleRouters,
  permission: permissionRouters,
  tool: toolRouter,
  chemicalMaterial: chemicalMaterialRouter,
  cluster: clusterRouter,
  parameterCategories: parameterCategoriesRouter,
  parameter: parameterRouter,
  parameterTool: parameterToolRouter,
  parameterChemicalMaterial: parameterChemicalMaterialRouter,
  province: provinceRouter,
  regency: regencyRouter,
  district: districtRouter,
  village: villageRouter,
  kbli: kbliRouter,
  userCompany: userCompanyRouter,
  userCompanyTestingLocation: userCompanyTestingLocationRouter,
  cart: cartRouter,
  order: orderRouter,
  event: eventRouter,
  test: testRouter,
  testing: testingRouter,
  audit: auditRouter,
  document: documentRouter,
  position: positionRouter,
  employee: employeeRouter,
  notifications: notificationsRouter,
  worksheet: worksheetRouter,
  generateDocument: generateDocumentRouter,
  survey: surveyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
