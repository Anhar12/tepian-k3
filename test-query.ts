import { Effect } from "effect";
import pelatihanQueries from "./packages/queries/src/pelatihan/pelatihan.queries";

async function run() {
  try {
    const result = await Effect.runPromise(
      pelatihanQueries.getAllPelatihan({
        page: 1,
        perPage: 20,
        status: "published",
        search: "",
        sort: [],
        createdAt: [],
        filters: [],
        joinOperator: "and",
        showDeleted: false
      })
    );
    console.log("Success:", result);
  } catch (error) {
    console.error("Error details:", error);
  }
}

run();
