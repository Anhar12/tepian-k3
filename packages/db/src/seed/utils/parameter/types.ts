import z from "zod";

export const ParamterSchema = z.array(
  z.object({
    kategoriParameter: z.string(),
    parameter: z.string(),
    satuan: z.string(),
    cluster: z.string(),
    harga: z.number(),
  }),
);

export type Parameters = z.infer<typeof ParamterSchema>;
