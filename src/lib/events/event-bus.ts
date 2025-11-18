import { randomUUID } from 'crypto';
import { DomainEvent, DomainEventType } from '../../types';

type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

export class EventBus {
  private handlers: Map<DomainEventType, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();

  /**
   * Register a handler for a specific event type
   */
  on<T = any>(eventType: DomainEventType, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  /**
   * Register a handler for all events
   */
  onAll(handler: EventHandler): void {
    this.globalHandlers.add(handler);
  }

  /**
   * Unregister a handler
   */
  off(eventType: DomainEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit<T = any>(type: DomainEventType, payload: T, metadata?: Record<string, any>): Promise<void> {
    const event: DomainEvent<T> = {
      id: randomUUID(),
      type,
      timestamp: new Date(),
      payload,
      metadata,
    };

    // Execute global handlers
    for (const handler of this.globalHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error in global event handler:`, error);
      }
    }

    // Execute type-specific handlers
    const handlers = this.handlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Error in ${type} event handler:`, error);
        }
      }
    }
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
  }

  /**
   * Get count of handlers for an event type
   */
  handlerCount(eventType?: DomainEventType): number {
    if (eventType) {
      return (this.handlers.get(eventType)?.size || 0) + this.globalHandlers.size;
    }
    let total = this.globalHandlers.size;
    this.handlers.forEach(handlers => {
      total += handlers.size;
    });
    return total;
  }
}

// Singleton instance
export const eventBus = new EventBus();
