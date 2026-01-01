import cartQueries from "@tepian-k3/queries/cart.queries";
import { createTRPCRouter, protectedProcedure } from "..";
import { Effect } from "effect";
import z from "zod";
import cartSchema from "@tepian-k3/schema/cart.schema";

export const cartRouter = createTRPCRouter({
  getAllCartItems: protectedProcedure.query(
    async ({ ctx }) =>
      await Effect.runPromise(cartQueries.getUserCartList(ctx.user.id))
  ),

  insertCartItem: protectedProcedure
    .input(cartSchema.createCartSchema)
    .mutation(
      async ({ input, ctx }) =>
        await Effect.runPromise(cartQueries.insertCartItem(ctx.user.id, input))
    ),

  incrementCartItemQuantity: protectedProcedure
    .input(
      z.object({
        cartItemId: z.string(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(
          cartQueries.incrementCartItemQuantity(input.cartItemId)
        )
    ),

  decrementCartItemQuantity: protectedProcedure
    .input(
      z.object({
        cartItemId: z.string(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(
          cartQueries.decrementCartItemQuantity(input.cartItemId)
        )
    ),

  updateCartItemQuantity: protectedProcedure
    .input(
      z.object({
        cartItemId: z.string(),
        quantity: z.number().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return await Effect.runPromise(
        cartQueries.updateCartItemQuantity(input.cartItemId, input.quantity)
      );
    }),
});
