import { banners } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "./pagination.schema";

export const SORTABLE_BANNER_FIELDS = [
  "isActive",
  "order",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof banners.$inferSelect)[];

const getAllBannersSchema = createPaginationSchema(
  SORTABLE_BANNER_FIELDS,
).extend({
  title: z.string().default(""),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

const createBannerSchema = createInsertSchema(banners, {
  title: z.string().min(1).max(255),
  type: z.enum(["hero", "info"]),
  order: z.number(),
  isActive: z.boolean(),
})
  .omit({
    bannerUrl: true,
  })
  .extend({
    picture: z
      .file()
      .max(10 * 1024 * 1024)
      .mime(["image/jpeg", "image/png", "image/webp"]),
    type: z.enum(["hero", "info"]),
  });

const updateBannerSchema = createUpdateSchema(banners, {
  id: z.uuidv7(),
  title: z.string().min(1).max(255),
  type: z.enum(["hero", "info"]).optional(),
  order: z.optional(z.number()),
  isActive: z.optional(z.boolean()),
})
  .omit({
    bannerUrl: true,
  })
  .extend({
    picture: z
      .file()
      .max(10 * 1024 * 1024)
      .mime(["image/jpeg", "image/png", "image/webp"])
      .optional(),
    type: z.enum(["hero", "info"]).optional(),
  });

const reorderBannersSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.uuidv7(),
        order: z.number().int().min(0),
      }),
    )
    .min(1),
});

const bannerSchema = {
  getAllBannersSchema,
  createBannerSchema,
  updateBannerSchema,
  reorderBannersSchema,
};

export default bannerSchema;
