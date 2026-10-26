// src/modules/FloorPlanDesigner/Document/Geometry/WallsRepository.ts

import { EntityRepository } from "@/modules/FloorPlanDesigner/Document/Geometry/EntityRepository";
import { GeometryEntityType, GeometryOperation, GeometryEvent } from "@/modules/FloorPlanDesigner/Document/Events/GeometryEvent";
import type { Wall } from "@/modules/FloorPlanDesigner/Models/Wall";

export class WallsRepository extends EntityRepository<Wall> {
  constructor(events: any) {
    super(events);
  }
  
  protected getEntityType(): string {
    return "Wall";
  }
  
  protected getEntityId(wall: Wall): string {
    return wall.getId ? wall.getId() : (wall as any).id;
  }
  
  protected onAdded(wall: Wall): void {
    this.publishEvent(GeometryOperation.Added, wall);
  }
  
  protected onUpdated(wall: Wall): void {
    this.publishEvent(GeometryOperation.Updated, wall);
  }
  
  protected onRemoved(wall: Wall): void {
    this.publishEvent(GeometryOperation.Removed, wall);
  }
  
  protected onCleared(): void {
    this.publishEvent(GeometryOperation.Cleared, null);
  }
  
  private publishEvent(operation: GeometryOperation, wall: Wall | null): void {
    if (!this.events?.bus?.publish) return;
    
    const id = wall ? this.getEntityId(wall) : "all";
    this.events.bus.publish(
      new GeometryEvent(GeometryEntityType.Wall, operation, id, wall)
    );
  }
}