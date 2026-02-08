import z from "zod";
import { TOOLS_CONDITIONS, TOOLS_AVAILABILITY } from "@tepian-k3/constants";

export const ToolSchema = z.object({
  toolCode: z.string(),
  toolName: z.string(),
  function: z.string().optional(),
  location: z.string().optional(),
  shelf: z.string().optional(),
  brand: z.string().optional(),
  type: z.string().optional(),
  condition: z.enum(TOOLS_CONDITIONS),
  availability: z.enum(TOOLS_AVAILABILITY),
  parameters: z.array(z.string()),
});

export type Tool = z.infer<typeof ToolSchema>;
export type Tools = Tool[];
