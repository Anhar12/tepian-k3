import { createTRPCRouter, publicProcedure } from "../..";

export const konsultasiRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return "OK";
  }),
});
