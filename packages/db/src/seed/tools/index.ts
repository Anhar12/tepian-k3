import { inArray } from "drizzle-orm";
import { db } from "../../client";
import { parameters, parameterTools, toolCodes, tools } from "../../schema";
import { getTools } from "../utils/tools";

type InsertToolCode = typeof toolCodes.$inferInsert;
type InsertTool = typeof tools.$inferInsert;
type InsertParameterTool = typeof parameterTools.$inferInsert;

/**
 * Extracts the prefix from a tool code string (e.g. "SLM" from "SLM-001").
 */
function getToolCodePrefix(toolCode: string): string {
  return toolCode.split("-")[0] ?? toolCode;
}

function getToolCodeSuffix(toolCode: string): string {
  return toolCode.split("-").slice(1).join("-") || toolCode;
}

export const generateTools = async (): Promise<{
  toolCodesData: InsertToolCode[];
  toolsData: {
    toolUniqueCode: string;
    toolCodePrefix: string;
    toolName: string;
    function?: string;
    location?: string;
    shelf?: string;
    brand?: string;
    type?: string;
    condition: InsertTool["condition"];
    availability: InsertTool["availability"];
  }[];
  parameterToolsData: { toolUniqueCode: string; parameterNames: string[] }[];
}> => {
  const toolsList = await getTools();

  // Extract unique prefixes for the toolCodes table
  const uniquePrefixes = [
    ...new Set(toolsList.map((t) => getToolCodePrefix(t.toolCode))),
  ];
  const toolCodesData: InsertToolCode[] = uniquePrefixes.map((prefix) => ({
    code: prefix,
    isActive: true,
  }));

  const toolsData = toolsList.map((tool) => ({
    toolCodePrefix: getToolCodePrefix(tool.toolCode),
    toolUniqueCode: getToolCodeSuffix(tool.toolCode),
    toolName: tool.toolName,
    function: tool.function,
    location: tool.location,
    shelf: tool.shelf,
    brand: tool.brand,
    type: tool.type,
    condition: tool.condition,
    availability: tool.availability,
  }));

  const parameterToolsData = toolsList.map((tool) => ({
    toolUniqueCode: getToolCodeSuffix(tool.toolCode),
    parameterNames: tool.parameters,
  }));

  return { toolCodesData, toolsData, parameterToolsData };
};

async function seedTools() {
  const { toolCodesData, toolsData, parameterToolsData } =
    await generateTools();

  // Insert tool codes first (skip existing by code)
  const insertedToolCodes = await db
    .insert(toolCodes)
    .values(toolCodesData)
    .onConflictDoNothing({ target: toolCodes.code })
    .returning();

  // Also fetch any pre-existing tool codes that were skipped
  const allToolCodes = await db.query.toolCodes.findMany();
  console.log(
    `✅ ${insertedToolCodes.length} new Tool Codes seeded (${allToolCodes.length} total)`,
  );

  // Map prefix → toolCode UUID (from both new and existing)
  const prefixToId = new Map(allToolCodes.map((tc) => [tc.code, tc.id]));

  // Build tools insert data
  const toolsInsertData: InsertTool[] = toolsData.map((tool) => {
    const toolCodeId = prefixToId.get(tool.toolCodePrefix);
    if (!toolCodeId) {
      throw new Error(`Tool code prefix "${tool.toolCodePrefix}" not found`);
    }
    return {
      toolCodeId,
      toolUniqueCode: tool.toolUniqueCode,
      toolName: tool.toolName,
      function: tool.function,
      location: tool.location,
      shelf: tool.shelf,
      brand: tool.brand,
      type: tool.type,
      condition: tool.condition,
      availability: tool.availability,
    };
  });

  // Append tools (skip existing by toolUniqueCode)
  const insertedTools = await db
    .insert(tools)
    .values(toolsInsertData)
    .returning();

  // Also fetch any pre-existing tools that were skipped
  const allTools = await db.query.tools.findMany();
  console.log(
    `✅ ${insertedTools.length} new Tools seeded (${allTools.length} total)`,
  );

  // Map toolUniqueCode → toolId (from both new and existing)
  const toolUniqueCodeToId = new Map(
    allTools.map((t) => [t.toolUniqueCode, t.id]),
  );

  // Get all unique parameter names
  const allParameterNames = [
    ...new Set(parameterToolsData.flatMap((pt) => pt.parameterNames)),
  ];

  // Fetch all parameters in a single query
  const parameterRecords = await db.query.parameters.findMany({
    where: inArray(parameters.name, allParameterNames),
  });

  // Map parameter name → parameterId
  const parameterNameToId = new Map(
    parameterRecords.map((p) => [p.name, p.id]),
  );

  // Build parameter_tools insert data
  const parameterToolsInsertData: InsertParameterTool[] = [];

  for (const { toolUniqueCode, parameterNames } of parameterToolsData) {
    const toolId = toolUniqueCodeToId.get(toolUniqueCode);
    if (!toolId) {
      console.warn(
        `⚠️ Tool with unique code ${toolUniqueCode} not found, skipping...`,
      );
      continue;
    }

    for (const parameterName of parameterNames) {
      const parameterId = parameterNameToId.get(parameterName);
      if (!parameterId) {
        console.warn(
          `⚠️ Parameter "${parameterName}" not found for tool ${toolUniqueCode}, skipping...`,
        );
        continue;
      }

      parameterToolsInsertData.push({ toolId, parameterId });
    }
  }

  // Append parameter-tool relationships (skip existing)
  if (parameterToolsInsertData.length > 0) {
    await db
      .insert(parameterTools)
      .values(parameterToolsInsertData)
      .onConflictDoNothing()
      .execute();
    console.log(
      `✅ ${parameterToolsInsertData.length} Parameter-Tool relationships seeded`,
    );
  }
}

export default seedTools;
