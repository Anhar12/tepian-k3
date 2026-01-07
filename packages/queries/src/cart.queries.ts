import { TRPCError } from "@trpc/server";
import { db, type DBorTx } from "@tepian-k3/db/client";
import { and, count, eq } from "@tepian-k3/db";
import { cart, parameters, userCompanies } from "@tepian-k3/db/schema";
import { z } from "zod";
import cartSchema from "@tepian-k3/schema/cart.schema";
import { Effect } from "effect";
import { logger } from "@tepian-k3/services/logger";
import parameterQueries from "./parameter.queries";

const cartQueries = {
  getUserCartList(userId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.cart.findMany({
          where: eq(cart.userId, userId),
          with: {
            location: {
              columns: {
                id: true,
                name: true,
              },
            },
            parameter: {
              columns: {
                id: true,
                name: true,
              },
              with: {
                category: {
                  columns: {
                    id: true,
                    name: true,
                  },
                  with: {
                    cluster: {
                      columns: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      catch: (error) => {
        logger.error("Error fetching user cart list", {
          error,
          userId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user cart list",
        });
      },
    });
  },

  getUserCartCount(userId: string) {
    return Effect.tryPromise({
      try: () =>
        db
          .select({
            count: count(),
          })
          .from(cart)
          .where(eq(cart.userId, userId))
          .then((result) => Number(result[0]?.count)),
      catch: (error) => {
        logger.error("Error fetching user cart count", {
          error,
          userId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user cart count",
        });
      },
    });
  },

  getCartItemById(cartItemId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.cart.findFirst({
          where: eq(cart.id, cartItemId),
        }),
      catch: (error) => {
        logger.error("Error fetching cart item by ID", {
          error,
          cartItemId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cart item by ID",
        });
      },
    });
  },

  getCartItemByParameterId(
    userId: string,
    parameterId: string,
    locationId: string
  ) {
    return Effect.tryPromise({
      try: () =>
        db.query.cart.findFirst({
          where: and(
            eq(cart.userId, userId),
            eq(cart.parameterId, parameterId),
            eq(cart.locationId, locationId)
          ),
        }),
      catch: (error) => {
        logger.error("Error fetching cart item by parameter ID", {
          error,
          userId,
          parameterId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cart item by parameter ID",
        });
      },
    });
  },

  insertCartItem(
    userId: string,
    data: z.infer<typeof cartSchema.createCartSchema>
  ) {
    return Effect.gen(this, function* () {
      const isParameterExisting = yield* parameterQueries.getParameterById(
        data.parameterId
      );

      if (!isParameterExisting) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Parameter does not exist",
          })
        );
      }

      // 2. Validate company ownership
      const company = yield* Effect.tryPromise({
        try: () =>
          db.query.userCompanies.findFirst({
            where: and(
              eq(userCompanies.id, data.companyId),
              eq(userCompanies.userId, userId)
            ),
          }),
        catch: (error) => {
          logger.error("Failed to validate company ownership", {
            error,
            userId,
            companyId: data.companyId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to validate company",
          });
        },
      });

      if (!company) {
        return yield* Effect.fail(
          new TRPCError({
            code: "FORBIDDEN",
            message: "Company not found or you don't have access",
          })
        );
      }

      // 5. Validate parameters and prices
      const params = yield* Effect.tryPromise({
        try: () =>
          db.query.parameters.findFirst({
            where: eq(parameters.id, data.parameterId),
          }),
        catch: (error) => {
          logger.error("Failed to validate parameters", {
            error,
            parameterId: data.parameterId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to validate parameters",
          });
        },
      });

      if (!params) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Parameter not found",
          })
        );
      }

      // 6. Validate price matches
      const invalidPrice = params.price !== data.price;
      if (invalidPrice) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Price mismatch detected. Please refresh and try again.",
          })
        );
      }

      const existingCartItem = yield* cartQueries.getCartItemByParameterId(
        userId,
        data.parameterId,
        data.locationId
      );

      const result = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            if (existingCartItem) {
              const [updated] = await Effect.runPromise(
                this.updateCartItemQuantity(
                  existingCartItem.id,
                  existingCartItem.quantity + data.quantity,
                  tx
                )
              );

              if (!updated) {
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Failed to update cart item",
                });
              }

              return updated;
            }

            // Only create new item if none exists
            const [newCartItem] = await Effect.runPromise(
              this.insertNewCartItem(userId, data, tx)
            );

            if (!newCartItem) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create new cart item",
              });
            }

            return newCartItem;
          }),
        catch: (error) => {
          logger.error("Error inserting cart item", {
            error,
            userId,
            data,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to insert cart item",
          });
        },
      });

      return result;
    });
  },

  insertNewCartItem(
    userId: string,
    data: z.infer<typeof cartSchema.createCartSchema>,
    tx: DBorTx = db
  ) {
    return Effect.tryPromise({
      try: () =>
        tx
          .insert(cart)
          .values({
            userId,
            companyId: data.companyId,
            locationId: data.locationId,
            parameterId: data.parameterId,
            quantity: data.quantity,
            price: data.price,
          })
          .returning(),
      catch: (error) => {
        logger.error("Error inserting new cart item", {
          error,
          userId,
          data,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to insert new cart item",
        });
      },
    });
  },

  updateCartItemQuantity(
    cartItemId: string,
    quantity: number,
    tx: DBorTx = db
  ) {
    return Effect.tryPromise({
      try: () =>
        tx
          .update(cart)
          .set({ quantity })
          .where(eq(cart.id, cartItemId))
          .returning(),
      catch: (error) => {
        logger.error("Error updating cart item quantity", {
          error,
          cartItemId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update cart item quantity",
        });
      },
    });
  },

  incrementCartItemQuantity(
    cartItemId: string,
    incrementBy: number = 1,
    tx: DBorTx = db
  ) {
    return Effect.gen(this, function* () {
      // First, get the current cart item
      const cartItem = yield* this.getCartItemById(cartItemId);

      if (!cartItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cart item not found",
        });
      }

      const newQuantity = cartItem.quantity + incrementBy;

      const [result] = yield* Effect.tryPromise({
        try: () =>
          tx
            .update(cart)
            .set({ quantity: newQuantity })
            .where(eq(cart.id, cartItemId))
            .returning(),
        catch: (error) => {
          logger.error("Error incrementing cart item quantity", {
            error,
            cartItemId,
            incrementBy,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to increment cart item quantity",
          });
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to increment cart item quantity",
        });
      }

      return result;
    });
  },

  // Add this new method to cartQueries object:
  decrementCartItemQuantity(
    cartItemId: string,
    decrementBy: number = 1,
    tx: DBorTx = db
  ) {
    return Effect.gen(this, function* () {
      // First, get the current cart item
      const cartItem = yield* this.getCartItemById(cartItemId);

      if (!cartItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cart item not found",
        });
      }

      const newQuantity = cartItem.quantity - decrementBy;

      // If quantity becomes 0 or less, delete the item
      if (newQuantity <= 0) {
        return yield* this.deleteCartItem(cartItemId, tx);
      }

      // Otherwise, update the quantity
      const [result] = yield* Effect.tryPromise({
        try: () =>
          tx
            .update(cart)
            .set({ quantity: newQuantity })
            .where(eq(cart.id, cartItemId))
            .returning(),
        catch: (error) => {
          logger.error("Error decrementing cart item quantity", {
            error,
            cartItemId,
            decrementBy,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to decrement cart item quantity",
          });
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to decrement cart item quantity",
        });
      }

      return result;
    });
  },

  deleteCartItem(cartItemId: string, tx: DBorTx = db) {
    return Effect.tryPromise({
      try: () => tx.delete(cart).where(eq(cart.id, cartItemId)).returning(),
      catch: (error) => {
        logger.error("Error deleting cart item", {
          error,
          cartItemId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete cart item",
        });
      },
    });
  },
};

export default cartQueries;
