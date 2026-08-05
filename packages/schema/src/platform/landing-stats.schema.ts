import z from "zod";

export const upsertLandingStatSchema = z.object({
  serviceType: z.enum(["pengujian", "pelatihan", "uji_kompetensi"]),
  primaryCount: z.number().int().min(0),
  primaryLabel: z.string().min(1).max(100),
  secondaryCount: z.number().int().min(0),
  secondaryLabel: z.string().min(1).max(100),
  sortOrder: z.number().int().optional().default(0),
});

const landingStatsSchema = {
  upsertLandingStatSchema,
};

export default landingStatsSchema;
