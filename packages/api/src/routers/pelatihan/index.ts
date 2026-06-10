import { createTRPCRouter, publicProcedure } from "../..";
import { pelatihanBaseRouter } from "./pelatihan";
import { pelatihanOrderRouter } from "./order";
import { pelatihanCartRouter } from "./cart";
import { enrollmentRouter } from "./enrollment";
import { assessmentRouter } from "./assessment";
import { materialsRouter } from "./materials";
import { profileRouter } from "./profile";
import { certificateRouter } from "./certificate";

export const pelatihanRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return "OK";
  }),
  base: pelatihanBaseRouter,
  order: pelatihanOrderRouter,
  cart: pelatihanCartRouter,
  enrollment: enrollmentRouter,
  assessment: assessmentRouter,
  materials: materialsRouter,
  profile: profileRouter,
  certificate: certificateRouter,
});
