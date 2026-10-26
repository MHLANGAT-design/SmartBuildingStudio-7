// src/modules/FloorPlanDesigner/Document/DocumentEventDispatcher.ts

import { IDocumentEvent } from "@/modules/FloorPlanDesigner/Document/DocumentEvent";

type EventHandler = (event: IDocumentEvent) => void;

export class DocumentEventDispatcher {
  private handlers: EventHandler[] = [];

  subscribe(handler: EventHandler): void {
    this.handlers.push(handler);
  }

  unsubscribe(handler: EventHandler): void {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  dispatch(event: IDocumentEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }

  clear(): void {
    this.handlers = [];
  }
}