import { createTRPCRouter, publicProcedure } from "../..";

export const ujiKompetensiRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return "OK";
  }),
});
