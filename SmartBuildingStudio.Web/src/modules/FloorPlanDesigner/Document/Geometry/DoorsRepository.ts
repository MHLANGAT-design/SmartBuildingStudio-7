// src/modules/FloorPlanDesigner/Document/Geometry/DoorsRepository.ts

import { EntityRepository } from "@/modules/FloorPlanDesigner/Document/Geometry/EntityRepository";
import { GeometryEntityType, GeometryOperation, GeometryEvent } from "@/modules/FloorPlanDesigner/Document/Events/GeometryEvent";
import type { Door } from "@/modules/FloorPlanDesigner/Models/Door";

export class DoorsRepository extends EntityRepository<Door> {
  constructor(events: any) {
    super(events);
  }
  
  protected getEntityType(): string {
    return "Door";
  }
  
  protected getEntityId(door: Door): string {
    return door.getId ? door.getId() : (door as any).id;
  }
  
  protected onAdded(door: Door): void {
    this.publishEvent(GeometryOperation.Added, door);
  }
  
  protected onUpdated(door: Door): void {
    this.publishEvent(GeometryOperation.Updated, door);
  }
  
  protected onRemoved(door: Door): void {
    this.publishEvent(GeometryOperation.Removed, door);
  }
  
  protected onCleared(): void {
    this.publishEvent(GeometryOperation.Cleared, null);
  }
  
  private publishEvent(operation: GeometryOperation, door: Door | null): void {
    if (!this.events?.bus?.publish) return;
    
    const id = door ? this.getEntityId(door) : "all";
    this.events.bus.publish(
      new GeometryEvent(GeometryEntityType.Door, operation, id, door)
    );
  }
}