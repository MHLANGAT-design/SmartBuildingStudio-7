// src/modules/FloorPlanDesigner/Document/Geometry/ImportedDrawingRepository.ts

import { EntityRepository } from "@/modules/FloorPlanDesigner/Document/Geometry/EntityRepository";
import { GeometryEntityType, GeometryOperation, GeometryEvent } from "@/modules/FloorPlanDesigner/Document/Events/GeometryEvent";
import type { ImportedDrawing } from "@/modules/FloorPlanDesigner/Models/ImportedDrawing";

export class ImportedDrawingRepository extends EntityRepository<ImportedDrawing> {
  constructor(events: any) {
    super(events);
  }
  
  protected getEntityType(): string {
    return "ImportedDrawing";
  }
  
  protected getEntityId(drawing: ImportedDrawing): string {
    return drawing.getId ? drawing.getId() : (drawing as any).id;
  }
  
  protected onAdded(drawing: ImportedDrawing): void {
    this.publishEvent(GeometryOperation.Added, drawing);
  }
  
  protected onUpdated(drawing: ImportedDrawing): void {
    this.publishEvent(GeometryOperation.Updated, drawing);
  }
  
  protected onRemoved(drawing: ImportedDrawing): void {
    this.publishEvent(GeometryOperation.Removed, drawing);
  }
  
  protected onCleared(): void {
    this.publishEvent(GeometryOperation.Cleared, null);
  }
  
  private publishEvent(operation: GeometryOperation, drawing: ImportedDrawing | null): void {
    if (!this.events?.bus?.publish) return;
    
    const id = drawing ? this.getEntityId(drawing) : "all";
    this.events.bus.publish(
      new GeometryEvent(GeometryEntityType.ImportedDrawing, operation, id, drawing)
    );
  }
}