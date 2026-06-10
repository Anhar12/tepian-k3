import pelatihanCartQueries from "@tepian-k3/queries/pelatihan/cart.queries";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../..";
import { runEffect } from "../../utils/run-effect";

export const pelatihanCartRouter = createTRPCRouter({
  getCart: protectedProcedure.query(async ({ ctx }) => {
    return await runEffect(pelatihanCartQueries.getCart(ctx.user.id));
  }),

  addToCart: protectedProcedure
    .input(z.object({ pelatihanId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        pelatihanCartQueries.addToCart(ctx.user.id, input.pelatihanId),
      );
    }),

  removeFromCart: protectedProcedure
    .input(z.object({ pelatihanId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        pelatihanCartQueries.removeFromCart(ctx.user.id, input.pelatihanId),
      );
    }),

  clearCart: protectedProcedure.mutation(async ({ ctx }) => {
    return await runEffect(pelatihanCartQueries.clearCart(ctx.user.id));
  }),
});
