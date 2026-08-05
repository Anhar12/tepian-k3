import z from "zod";

export const PROVINCE_KEYS = [
  "kalimantan_timur",
  "kalimantan_selatan",
  "kalimantan_utara",
  "kalimantan_tengah",
  "kalimantan_barat",
] as const;

export const createLandingRegionSchema = z.object({
  provinceName: z.string().min(1).max(100),
  provinceKey: z.enum(PROVINCE_KEYS),
  companyCount: z.number().int().min(0),
  sortOrder: z.number().int().optional().default(0),
});

export const updateLandingRegionSchema = createLandingRegionSchema
  .partial()
  .extend({
    id: z.uuidv7(),
  });

const landingRegionSchema = {
  createLandingRegionSchema,
  updateLandingRegionSchema,
};

export default landingRegionSchema;
