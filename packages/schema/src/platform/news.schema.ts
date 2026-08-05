import { news } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import {
  createCursorPaginationSchema,
  createPaginationSchema,
} from "./pagination.schema";

export const SORTABLE_NEWS_FIELDS = [
  "title",
  "isPublished",
  "publishedAt",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof news.$inferSelect)[];

const getAllNewsSchema = createPaginationSchema(SORTABLE_NEWS_FIELDS).extend({
  title: z.string().default(""),
  isPublished: z.boolean().optional(),
});

const getCursorPaginatedNewsSchema = createCursorPaginationSchema(
  SORTABLE_NEWS_FIELDS,
).extend({
  title: z.string().default(""),
  isPublished: z.boolean().optional(),
});

const createNewsSchema = createInsertSchema(news, {
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  isPublished: z.boolean(),
  publishedAt: z.iso.datetime().optional(),
})
  .omit({
    imageUrl: true,
  })
  .extend({
    image: z
      .file()
      .max(10 * 1024 * 1024)
      .mime(["image/jpeg", "image/png", "image/webp"]),
  });

const updateNewsSchema = createUpdateSchema(news, {
  id: z.uuidv7(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  isPublished: z.optional(z.boolean()),
  publishedAt: z.optional(z.iso.datetime()),
})
  .omit({
    imageUrl: true,
  })
  .extend({
    image: z
      .file()
      .max(10 * 1024 * 1024)
      .mime(["image/jpeg", "image/png", "image/webp"])
      .optional(),
  });

const newsSchema = {
  getAllNewsSchema,
  getCursorPaginatedNewsSchema,
  createNewsSchema,
  updateNewsSchema,
};

export default newsSchema;
