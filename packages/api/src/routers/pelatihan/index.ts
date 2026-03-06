import { createTRPCRouter, publicProcedure } from "../..";

export const pelatihanRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return "OK";
  }),
});
