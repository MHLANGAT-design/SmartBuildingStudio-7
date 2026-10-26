// src/modules/FloorPlanDesigner/Document/Events/DrawingDocumentEvents.ts

import { GeometryEvent } from "@/modules/FloorPlanDesigner/Document/Events/GeometryEvent";

type EventHandler = (event: GeometryEvent) => void;

export class EventBus {
  private handlers: EventHandler[] = [];

  publish(event: GeometryEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }

  subscribe(handler: EventHandler): void {
    this.handlers.push(handler);
  }

  unsubscribe(handler: EventHandler): void {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  clear(): void {
    this.handlers = [];
  }
}

export class DrawingDocumentEvents {
  public readonly bus = new EventBus();

  dispose(): void {
    this.bus.clear();
  }
}