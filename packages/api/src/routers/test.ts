import z from "zod";
import { createTRPCRouter, publicProcedure } from "..";
import { EventTypes } from "@tepian-k3/schema/event.schema";

export const testRouter = createTRPCRouter({
  broadcastTestEvent: publicProcedure
    .input(
      z.object({
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const event = {
        message: input.message,
      };

      await ctx.eventBus.publish(EventTypes.BROADCAST_TEST, event);

      return { success: true };
    }),
});
