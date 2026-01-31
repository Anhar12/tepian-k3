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
  order: z.number(),
  isActive: z.boolean(),
})
  .omit({
    bannerUrl: true,
  })
  .extend({
    picture: z
      .file()
      .max(2 * 1024 * 1024)
      .mime(["image/jpeg", "image/png", "image/webp"]),
  });

const updateBannerSchema = createUpdateSchema(banners, {
  id: z.uuidv7(),
  title: z.string().min(1).max(255),
  order: z.optional(z.number()),
  isActive: z.optional(z.boolean()),
})
  .omit({
    bannerUrl: true,
  })
  .extend({
    picture: z
      .file()
      .max(2 * 1024 * 1024)
      .mime(["image/jpeg", "image/png", "image/webp"])
      .optional(),
  });

const bannerSchema = {
  getAllBannersSchema,
  createBannerSchema,
  updateBannerSchema,
};

export default bannerSchema;
