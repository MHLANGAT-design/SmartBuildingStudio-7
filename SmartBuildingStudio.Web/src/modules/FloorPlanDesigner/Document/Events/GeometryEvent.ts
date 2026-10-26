// src/modules/FloorPlanDesigner/Document/Events/GeometryEvent.ts

export enum GeometryEntityType {
  Wall = "Wall",
  Door = "Door",
  Window = "Window",
  Room = "Room",
  ImportedDrawing = "ImportedDrawing",
  Fixture = "Fixture",
  Layer = "Layer"
}

export enum GeometryOperation {
  Added = "Added",
  Updated = "Updated",
  Removed = "Removed",
  Cleared = "Cleared"
}

export class GeometryEvent {
  constructor(
    public readonly entityType: GeometryEntityType,
    public readonly operation: GeometryOperation,
    public readonly entityId: string,
    public readonly entity: any,
    public readonly timestamp: number = Date.now()
  ) {}
}