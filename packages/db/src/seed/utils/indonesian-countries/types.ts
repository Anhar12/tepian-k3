import z from "zod";

const ProvincesSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    alt_name: z.string(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
  }),
);

export type Provinces = z.infer<typeof ProvincesSchema>;

const RegenciesSchema = z.array(
  z.object({
    id: z.string(),
    province_id: z.string(),
    name: z.string(),
    alt_name: z.string(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
  }),
);

export type Regencies = z.infer<typeof RegenciesSchema>;

const DistrictsSchema = z.array(
  z.object({
    id: z.string(),
    regency_id: z.string(),
    name: z.string(),
    alt_name: z.string(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
  }),
);

export type Districts = z.infer<typeof DistrictsSchema>;

const VillagesSchema = z.array(
  z.object({
    id: z.string(),
    district_id: z.string(),
    name: z.string(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
  }),
);

export type Villages = z.infer<typeof VillagesSchema>;

export { DistrictsSchema, ProvincesSchema, RegenciesSchema, VillagesSchema };
