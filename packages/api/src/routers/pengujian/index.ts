import { createTRPCRouter } from "../..";
import { cartRouter } from "./cart";
import { documentRouter } from "./document";
import { chemicalMaterialRouter } from "./chemical-material";
import { clusterRouter } from "./cluster";
import { generateDocumentRouter } from "./generate-document";
import { kbliRouter } from "./kbli";
import { orderRouter } from "./order";
import { parameterRouter } from "./parameter";
import { parameterCategoriesRouter } from "./parameter-categories";
import { parameterChemicalMaterialRouter } from "./parameter-chemical-material";
import { parameterToolRouter } from "./parameter-tool";
import { surveyRouter } from "./survey";
import { testRouter } from "./test";
import { testingRouter } from "./testing";
import { toolRouter } from "./tool";
import { userCompanyRouter } from "./user-company";
import { userCompanyTestingLocationRouter } from "./user-company-testing-location";
import { worksheetRouter } from "./worksheet";
import { toolCodeRouter } from "./tool-code";
import { pengujianExcelRouter } from "./pengujian-excel";
import { auditTrailRouter } from "./audit-trail";

export const pengujianRouter = createTRPCRouter({
  toolCode: toolCodeRouter,
  tool: toolRouter,
  chemicalMaterial: chemicalMaterialRouter,
  cluster: clusterRouter,
  parameterCategories: parameterCategoriesRouter,
  parameter: parameterRouter,
  parameterTool: parameterToolRouter,
  parameterChemicalMaterial: parameterChemicalMaterialRouter,
  kbli: kbliRouter,
  userCompany: userCompanyRouter,
  userCompanyTestingLocation: userCompanyTestingLocationRouter,
  cart: cartRouter,
  order: orderRouter,
  test: testRouter,
  testing: testingRouter,
  worksheet: worksheetRouter,
  generateDocument: generateDocumentRouter,
  survey: surveyRouter,
  document: documentRouter,
  pengujianExcel: pengujianExcelRouter,
  auditTrail: auditTrailRouter,
});
