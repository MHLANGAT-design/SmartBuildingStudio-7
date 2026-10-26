import { DocumentEvent } from "@/modules/FloorPlanDesigner/Document/Events/DocumentEvent";

export type EventHandler<T extends DocumentEvent> = (event: T) => void;

export class EventBus {
    private readonly handlers = new Map<Function, Set<EventHandler<any>>>();

    public subscribe<T extends DocumentEvent>(
        eventType: new (...args: any[]) => T,
        handler: EventHandler<T>
    ): () => void {
        let listeners = this.handlers.get(eventType);

        if (!listeners) {
            listeners = new Set();
            this.handlers.set(eventType, listeners);
        }

        listeners.add(handler);

        return () => this.unsubscribe(eventType, handler);
    }

    public unsubscribe<T extends DocumentEvent>(
        eventType: new (...args: any[]) => T,
        handler: EventHandler<T>
    ): void {
        this.handlers.get(eventType)?.delete(handler);
    }

    public publish<T extends DocumentEvent>(event: T): void {
        const listeners = this.handlers.get(event.constructor);

        if (!listeners) {
            return;
        }

        for (const handler of listeners) {
            handler(event);
        }
    }

    public clear(): void {
        this.handlers.clear();
    }
}
