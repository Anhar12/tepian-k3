import { readJsonFile } from "../indonesian-countries/utils";
import type { Tools } from "./types";

async function getTools() {
  const tools = await readJsonFile<Tools>(
    "data/tools.json",
    "src/seed/utils/tools/",
  );

  return tools;
}

export { getTools };
