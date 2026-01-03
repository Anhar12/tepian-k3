import cartQueries from "@tepian-k3/queries/cart.queries";
import { createTRPCRouter, protectedProcedure } from "..";
import z from "zod";
import cartSchema from "@tepian-k3/schema/cart.schema";
import { runEffect } from "../utils/run-effect";

export const cartRouter = createTRPCRouter({
  getAllCartItems: protectedProcedure.query(
    async ({ ctx }) => await runEffect(cartQueries.getUserCartList(ctx.user.id))
  ),

  getCartItemCount: protectedProcedure.query(
    async ({ ctx }) =>
      await runEffect(cartQueries.getUserCartCount(ctx.user.id))
  ),

  insertCartItem: protectedProcedure
    .input(cartSchema.createCartSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(cartQueries.insertCartItem(ctx.user.id, input))
    ),

  incrementCartItemQuantity: protectedProcedure
    .input(
      z.object({
        cartItemId: z.string(),
      })
    )
    .mutation(
      async ({ input }) =>
        await runEffect(cartQueries.incrementCartItemQuantity(input.cartItemId))
    ),

  decrementCartItemQuantity: protectedProcedure
    .input(
      z.object({
        cartItemId: z.string(),
      })
    )
    .mutation(
      async ({ input }) =>
        await runEffect(cartQueries.decrementCartItemQuantity(input.cartItemId))
    ),

  updateCartItemQuantity: protectedProcedure
    .input(
      z.object({
        cartItemId: z.string(),
        quantity: z.number().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return await runEffect(
        cartQueries.updateCartItemQuantity(input.cartItemId, input.quantity)
      );
    }),
});
