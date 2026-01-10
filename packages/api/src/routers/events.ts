import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "..";
import { EventTypes } from "@tepian-k3/schema/event.schema";

export const eventsRouter = createTRPCRouter({
  /**
   * SSE subscription for all user events
   * Client connects once and receives all event types
   */
  onEvent: protectedProcedure
    .input(
      z
        .object({
          eventTypes: z.array(z.enum(EventTypes)).optional(),
          /** Include events triggered by the current user */
          includeOwnEvents: z.boolean().optional(),
        })
        .optional()
    )
    .subscription(async function* ({ input, ctx, signal }) {
      const filterContext = {
        session: ctx.session,
        user: ctx.user,
      };

      // Note: Don't call eventBus.cleanup() here as it's a shared singleton
      // The EventBus will handle unsubscription in the subscribe method's finally block
      for await (const event of ctx.eventBus.subscribe(
        input?.eventTypes ?? Object.values(EventTypes),
        filterContext,
        signal,
        { includeOwnEvents: input?.includeOwnEvents ?? false }
      )) {
        yield event;
      }
    }),
});
