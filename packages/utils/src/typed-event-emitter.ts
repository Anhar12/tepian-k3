import EventEmitter from "eventemitter3";
import z from "zod";

export class TypedEventEmitter<TEventMap extends Record<string, unknown>> {
  private emitter: EventEmitter<string>;
  private schemas: Map<keyof TEventMap, z.ZodType>;

  constructor(schemas: Partial<Record<keyof TEventMap, z.ZodType>> = {}) {
    this.emitter = new EventEmitter();
    this.schemas = new Map(
      Object.entries(schemas) as [keyof TEventMap, z.ZodType][]
    );
  }

  /**
   * Emit an event with runtime validation
   * @throws {Error} If validation fails
   */
  emit<K extends keyof TEventMap & string>(
    event: K,
    data: TEventMap[K]
  ): boolean {
    const schema = this.schemas.get(event);

    if (schema) {
      try {
        // Validate data at runtime using Zod
        const validated = schema.parse(data);
        return this.emitter.emit(event, validated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error(`Event validation failed for "${event}":`, {
            event,
            errors: error.message,
            data,
          });
          throw new Error(
            `Invalid event data for "${event}": ${error.message}`
          );
        }
        throw error;
      }
    }

    // If no schema, emit without validation
    return this.emitter.emit(event, data);
  }

  /**
   * Add a listener for an event
   */
  on<K extends keyof TEventMap & string>(
    event: K,
    listener: (data: TEventMap[K]) => void,
    context?: unknown
  ): this {
    this.emitter.on(event, listener as (...args: unknown[]) => void, context);
    return this;
  }

  /**
   * Add a one-time listener for an event
   */
  once<K extends keyof TEventMap & string>(
    event: K,
    listener: (data: TEventMap[K]) => void,
    context?: unknown
  ): this {
    this.emitter.once(event, listener as (...args: unknown[]) => void, context);
    return this;
  }

  /**
   * Remove a specific listener
   */
  off<K extends keyof TEventMap & string>(
    event: K,
    listener?: (data: TEventMap[K]) => void,
    context?: unknown,
    once?: boolean
  ): this {
    if (listener) {
      this.emitter.off(
        event,
        listener as (...args: unknown[]) => void,
        context,
        once
      );
    } else {
      this.emitter.removeAllListeners(event);
    }
    return this;
  }

  /**
   * Remove all listeners for an event or all events
   */
  removeAllListeners<K extends keyof TEventMap & string>(event?: K): this {
    if (event !== undefined) {
      this.emitter.removeAllListeners(event);
    } else {
      this.emitter.removeAllListeners();
    }
    return this;
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount<K extends keyof TEventMap & string>(event: K): number {
    return this.emitter.listenerCount(event);
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): Array<keyof TEventMap & string> {
    return this.emitter.eventNames() as Array<keyof TEventMap & string>;
  }

  /**
   * Get all listeners for an event
   */
  listeners<K extends keyof TEventMap & string>(
    event: K
  ): Array<(data: TEventMap[K]) => void> {
    return this.emitter.listeners(event) as Array<(data: TEventMap[K]) => void>;
  }
}
