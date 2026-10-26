// src/modules/FloorPlanDesigner/Document/Geometry/RoomsRepository.ts

import { EntityRepository } from "@/modules/FloorPlanDesigner/Document/Geometry/EntityRepository";
import { GeometryEntityType, GeometryOperation, GeometryEvent } from "@/modules/FloorPlanDesigner/Document/Events/GeometryEvent";
import type { Room } from "@/modules/FloorPlanDesigner/Models/Room";

export class RoomsRepository extends EntityRepository<Room> {
  constructor(events: any) {
    super(events);
  }
  
  protected getEntityType(): string {
    return "Room";
  }
  
  protected getEntityId(room: Room): string {
    return room.getId ? room.getId() : (room as any).id;
  }
  
  protected onAdded(room: Room): void {
    this.publishEvent(GeometryOperation.Added, room);
  }
  
  protected onUpdated(room: Room): void {
    this.publishEvent(GeometryOperation.Updated, room);
  }
  
  protected onRemoved(room: Room): void {
    this.publishEvent(GeometryOperation.Removed, room);
  }
  
  protected onCleared(): void {
    this.publishEvent(GeometryOperation.Cleared, null);
  }
  
  private publishEvent(operation: GeometryOperation, room: Room | null): void {
    if (!this.events?.bus?.publish) return;
    
    const id = room ? this.getEntityId(room) : "all";
    this.events.bus.publish(
      new GeometryEvent(GeometryEntityType.Room, operation, id, room)
    );
  }
}