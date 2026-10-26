// src/modules/FloorPlanDesigner/Document/Geometry/WindowsRepository.ts

import { EntityRepository } from "@/modules/FloorPlanDesigner/Document/Geometry/EntityRepository";
import { GeometryEntityType, GeometryOperation, GeometryEvent } from "@/modules/FloorPlanDesigner/Document/Events/GeometryEvent";
import type { Window } from "@/modules/FloorPlanDesigner/Models/Window";

export class WindowsRepository extends EntityRepository<Window> {
  constructor(events: any) {
    super(events);
  }
  
  protected getEntityType(): string {
    return "Window";
  }
  
  protected getEntityId(window: Window): string {
    return window.getId ? window.getId() : (window as any).id;
  }
  
  protected onAdded(window: Window): void {
    this.publishEvent(GeometryOperation.Added, window);
  }
  
  protected onUpdated(window: Window): void {
    this.publishEvent(GeometryOperation.Updated, window);
  }
  
  protected onRemoved(window: Window): void {
    this.publishEvent(GeometryOperation.Removed, window);
  }
  
  protected onCleared(): void {
    this.publishEvent(GeometryOperation.Cleared, null);
  }
  
  private publishEvent(operation: GeometryOperation, window: Window | null): void {
    if (!this.events?.bus?.publish) return;
    
    const id = window ? this.getEntityId(window) : "all";
    this.events.bus.publish(
      new GeometryEvent(GeometryEntityType.Window, operation, id, window)
    );
  }
}