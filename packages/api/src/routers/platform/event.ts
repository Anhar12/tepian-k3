import { z } from "zod";
import { createTRPCRouter, protectedProcedure, withPermission } from "../..";
import {
  EventTypes,
  type BroadcastTestEvent,
  type NotificationEvent,
  type OrderStatusChangedEvent,
} from "@tepian-k3/schema/platform/event.schema";

export const eventRouter = createTRPCRouter({
  /**
   * SSE subscription for all user events
   * Client connects once and receives all event types
   */
  subscribe: protectedProcedure
    .input(
      z
        .object({
          eventTypes: z.array(z.enum(EventTypes)).optional(),
          /** Include events triggered by the current user */
          includeOwnEvents: z.boolean().optional(),
        })
        .optional(),
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
        { includeOwnEvents: input?.includeOwnEvents ?? false },
      )) {
        yield event;
      }
    }),

  /**
   * Subscribe to broadcast test events only
   * Returns properly typed BroadcastTestEvent
   */
  onBroadcastTest: protectedProcedure
    .input(
      z
        .object({
          includeOwnEvents: z.boolean().optional(),
        })
        .optional(),
    )
    .subscription(async function* ({ ctx, input, signal }) {
      const filterContext = {
        session: ctx.session,
        user: ctx.user,
      };

      for await (const event of ctx.eventBus.subscribe(
        [EventTypes.BROADCAST_TEST],
        filterContext,
        signal,
        { includeOwnEvents: input?.includeOwnEvents ?? false },
      )) {
        yield event.payload as BroadcastTestEvent;
      }
    }),

  /**
   * Subscribe to notification events only
   * Returns properly typed NotificationEvent
   */
  onNotification: protectedProcedure
    .input(
      z
        .object({
          includeOwnEvents: z.boolean().optional(),
        })
        .optional(),
    )
    .subscription(async function* ({ ctx, input, signal }) {
      const filterContext = {
        session: ctx.session,
        user: ctx.user,
      };

      for await (const event of ctx.eventBus.subscribe(
        [EventTypes.NOTIFICATION],
        filterContext,
        signal,
        { includeOwnEvents: input?.includeOwnEvents ?? false },
      )) {
        yield event.payload as NotificationEvent;
      }
    }),

  /**
   * Subscribe to order status changed events only
   * Returns properly typed OrderStatusChangedEvent
   */
  onOrderStatusChanged: protectedProcedure
    .input(
      z
        .object({
          includeOwnEvents: z.boolean().optional(),
        })
        .optional(),
    )
    .subscription(async function* ({ ctx, input, signal }) {
      const filterContext = {
        session: ctx.session,
        user: ctx.user,
      };

      for await (const event of ctx.eventBus.subscribe(
        [EventTypes.ORDER_STATUS_CHANGED],
        filterContext,
        signal,
        { includeOwnEvents: input?.includeOwnEvents ?? false },
      )) {
        yield event.payload as OrderStatusChangedEvent;
      }
    }),

  /**
   * Subscribe to worksheet note created events only
   * Returns properly typed WorksheetNoteCreatedEvent
   */
  onWorksheetNoteCreated: withPermission("worksheet-notes.read").subscription(
    async function* ({ ctx, signal }) {
      const filterContext = {
        session: ctx.session,
        user: ctx.user,
      };

      for await (const event of ctx.eventBus.subscribe(
        [EventTypes.WORKSHEET_NOTE_CREATED],
        filterContext,
        signal,
      )) {
        yield event.payload;
      }
    },
  ),
});
