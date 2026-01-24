import cartQueries from "@tepian-k3/queries/cart.queries";
import { createTRPCRouter, withProtectedRateLimit } from "..";
import z from "zod";
import cartSchema from "@tepian-k3/schema/cart.schema";
import { runEffect } from "../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

export const cartRouter = createTRPCRouter({
  getAllCartItems: withProtectedRateLimit(rateLimiters.lenient()).query(
    async ({ ctx }) =>
      await runEffect(cartQueries.getUserCartList(ctx.user.id)),
  ),

  getCartItemCount: withProtectedRateLimit(rateLimiters.lenient()).query(
    async ({ ctx }) =>
      await runEffect(cartQueries.getUserCartCount(ctx.user.id)),
  ),

  insertCartItem: withProtectedRateLimit(rateLimiters.lenient())
    .input(cartSchema.createCartSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(cartQueries.insertCartItem(ctx.user.id, input)),
    ),

  incrementCartItemQuantity: withProtectedRateLimit(rateLimiters.lenient())
    .input(
      z.object({
        cartItemId: z.string(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(
          cartQueries.incrementCartItemQuantity(input.cartItemId),
        ),
    ),

  decrementCartItemQuantity: withProtectedRateLimit(rateLimiters.lenient())
    .input(
      z.object({
        cartItemId: z.string(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(
          cartQueries.decrementCartItemQuantity(input.cartItemId),
        ),
    ),

  updateCartItemQuantity: withProtectedRateLimit(rateLimiters.lenient())
    .input(
      z.object({
        cartItemId: z.string(),
        quantity: z.number().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      return await runEffect(
        cartQueries.updateCartItemQuantity(input.cartItemId, input.quantity),
      );
    }),

  deleteCartItem: withProtectedRateLimit(rateLimiters.lenient())
    .input(
      z.object({
        cartItemId: z.string(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(cartQueries.deleteCartItem(input.cartItemId)),
    ),
});
