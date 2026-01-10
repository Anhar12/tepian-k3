import { TRPCError } from "@trpc/server";
import { db, type DBorTx } from "@tepian-k3/db/client";
import { and, count, eq } from "@tepian-k3/db";
import { cart, parameters, userCompanies } from "@tepian-k3/db/schema";
import { z } from "zod";
import cartSchema from "@tepian-k3/schema/cart.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import parameterQueries from "./parameter.queries";

const cartQueries = {
  getUserCartList(userId: string) {
    return Effect.gen(this, function* () {
      const cartItems = yield* Effect.tryPromise({
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
          logError(
            "cartQueries.getUserCartList",
            "Error fetching user cart list",
            {
              error,
              userId,
            }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil daftar keranjang pengguna.",
          });
        },
      });

      // Group cart items by location
      const groupedByLocation = cartItems.reduce((acc, item) => {
        const locationId = item.location.id;

        if (!acc[locationId]) {
          acc[locationId] = {
            id: item.location.id,
            name: item.location.name,
            items: [],
          };
        }

        acc[locationId].items.push(item);

        return acc;
      }, {} as Record<string, { id: string; name: string; items: typeof cartItems }>);

      // Convert to array and group items by cluster within each location
      return Object.values(groupedByLocation).map((location) => {
        // Group items by cluster
        const groupedByCluster = location.items.reduce((acc, item) => {
          const clusterId = item.parameter.category.cluster.id;

          if (!acc[clusterId]) {
            acc[clusterId] = {
              id: item.parameter.category.cluster.id,
              name: item.parameter.category.cluster.name,
              items: [],
            };
          }

          acc[clusterId].items.push(item);

          return acc;
        }, {} as Record<string, { id: string; name: string; items: typeof cartItems }>);

        return {
          id: location.id,
          name: location.name,
          items: Object.values(groupedByCluster),
        };
      });
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
        logError(
          "cartQueries.getUserCartCount",
          "Error fetching user cart count",
          {
            error,
            userId,
          }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil jumlah keranjang pengguna.",
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
        logError(
          "cartQueries.getCartItemById",
          "Error fetching cart item by ID",
          {
            error,
            cartItemId,
          }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil item keranjang berdasarkan ID",
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
        logError(
          "cartQueries.getCartItemByParameterId",
          "Error fetching cart item by parameter ID",
          {
            error,
            userId,
            parameterId,
            locationId,
          }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil item keranjang berdasarkan ID",
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
            message: "Parameter tidak ditemukan.",
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
          logError(
            "cartQueries.insertCartItem",
            "Error validating company ownership",
            { error, userId, companyId: data.companyId }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memvalidasi perusahaan.",
          });
        },
      });

      if (!company) {
        return yield* Effect.fail(
          new TRPCError({
            code: "FORBIDDEN",
            message: "Anda tidak memiliki akses ke perusahaan ini.",
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
          logError(
            "cartQueries.insertCartItem",
            "Error validating parameters",
            { error, parameterId: data.parameterId }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memvalidasi parameter",
          });
        },
      });

      if (!params) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Parameter tidak ditemukan.",
          })
        );
      }

      // 6. Validate price matches
      const invalidPrice = params.price !== data.price;
      if (invalidPrice) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Harga tidak sesuai. Silakan segarkan dan coba lagi.",
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
                  message: "Gagal memperbarui item keranjang",
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
                message: "Gagal membuat item keranjang baru",
              });
            }

            return newCartItem;
          }),
        catch: (error) => {
          logError("cartQueries.insertCartItem", "Error inserting cart item", {
            error,
            userId,
            data,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memasukkan item keranjang.",
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
        logError(
          "cartQueries.insertNewCartItem",
          "Error inserting new cart item",
          {
            error,
            userId,
            data,
          }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memasukkan item keranjang baru",
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
        logError(
          "cartQueries.updateCartItemQuantity",
          "Error updating cart item quantity",
          {
            error,
            cartItemId,
            quantity,
          }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui jumlah item keranjang",
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
          message: "Item keranjang tidak ditemukan",
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
          logError(
            "cartQueries.incrementCartItemQuantity",
            "Error incrementing cart item quantity",
            {
              error,
              cartItemId,
              incrementBy,
            }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menambah jumlah item keranjang",
          });
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menambah jumlah item keranjang",
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
          message: "Item keranjang tidak ditemukan",
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
          logError(
            "cartQueries.decrementCartItemQuantity",
            "Error decrementing cart item quantity",
            {
              error,
              cartItemId,
              decrementBy,
            }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengurangi jumlah item keranjang",
          });
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengurangi jumlah item keranjang",
        });
      }

      return result;
    });
  },

  deleteCartItem(cartItemId: string, tx: DBorTx = db) {
    return Effect.tryPromise({
      try: () => tx.delete(cart).where(eq(cart.id, cartItemId)).returning(),
      catch: (error) => {
        logError("cartQueries.deleteCartItem", "Error deleting cart item", {
          error,
          cartItemId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus item keranjang",
        });
      },
    });
  },
};

export default cartQueries;
