import { inArray } from "drizzle-orm";
import { db } from "../../client";
import { tools, parameters, parameterTools } from "../../schema";
import { getTools } from "../utils/tools";

type InsertTool = typeof tools.$inferInsert;
type InsertParameterTool = typeof parameterTools.$inferInsert;

export const generateTools = async (): Promise<{
  toolsData: InsertTool[];
  parameterToolsData: { toolCode: string; parameterNames: string[] }[];
}> => {
  const toolsList = await getTools();

  const toolsData: InsertTool[] = toolsList.map((tool) => ({
    toolCode: tool.toolCode,
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
    toolCode: tool.toolCode,
    parameterNames: tool.parameters,
  }));

  return { toolsData, parameterToolsData };
};

async function seedTools() {
  const { toolsData, parameterToolsData } = await generateTools();

  // Delete existing parameter_tools and tools
  await db.delete(parameterTools).execute();
  await db.delete(tools).execute();

  // Insert tools
  const insertedTools = await db.insert(tools).values(toolsData).returning();
  console.log(`✅ ${insertedTools.length} Tools have been seeded`);

  // Create a map of toolCode to toolId
  const toolCodeToId = new Map(insertedTools.map((t) => [t.toolCode, t.id]));

  // Get all unique parameter names from the tool mappings
  const allParameterNames = [
    ...new Set(parameterToolsData.flatMap((pt) => pt.parameterNames)),
  ];

  // Fetch all parameters in a single query
  const parameterRecords = await db.query.parameters.findMany({
    where: inArray(parameters.name, allParameterNames),
  });

  // Create a map of parameter name to parameterId
  const parameterNameToId = new Map(
    parameterRecords.map((p) => [p.name, p.id]),
  );

  // Build parameter_tools data
  const parameterToolsInsertData: InsertParameterTool[] = [];

  for (const { toolCode, parameterNames } of parameterToolsData) {
    const toolId = toolCodeToId.get(toolCode);
    if (!toolId) {
      console.warn(`⚠️ Tool with code ${toolCode} not found, skipping...`);
      continue;
    }

    for (const parameterName of parameterNames) {
      const parameterId = parameterNameToId.get(parameterName);
      if (!parameterId) {
        console.warn(
          `⚠️ Parameter "${parameterName}" not found for tool ${toolCode}, skipping...`,
        );
        continue;
      }

      parameterToolsInsertData.push({
        toolId,
        parameterId,
      });
    }
  }

  // Insert parameter_tools
  if (parameterToolsInsertData.length > 0) {
    await db.insert(parameterTools).values(parameterToolsInsertData).execute();
    console.log(
      `✅ ${parameterToolsInsertData.length} Parameter-Tool relationships have been seeded`,
    );
  }
}

export default seedTools;
