// src/modules/FloorPlanDesigner/Document/Geometry/GeometryModel.ts

import { DrawingDocumentEvents } from "@/modules/FloorPlanDesigner/Document/Events/DrawingDocumentEvents";
import { WallsRepository } from "@/modules/FloorPlanDesigner/Document/Geometry/WallsRepository";
import { DoorsRepository } from "@/modules/FloorPlanDesigner/Document/Geometry/DoorsRepository";
import { WindowsRepository } from "@/modules/FloorPlanDesigner/Document/Geometry/WindowsRepository";
import { RoomsRepository } from "@/modules/FloorPlanDesigner/Document/Geometry/RoomsRepository";
import { ImportedDrawingRepository } from "@/modules/FloorPlanDesigner/Document/Geometry/ImportedDrawingRepository";

export class GeometryModel {
  private readonly _walls: WallsRepository;
  private readonly _doors: DoorsRepository;
  private readonly _windows: WindowsRepository;
  private readonly _rooms: RoomsRepository;
  private readonly _importedDrawings: ImportedDrawingRepository;

  constructor(events: DrawingDocumentEvents) {
    this._walls = new WallsRepository(events);
    this._doors = new DoorsRepository(events);
    this._windows = new WindowsRepository(events);
    this._rooms = new RoomsRepository(events);
    this._importedDrawings = new ImportedDrawingRepository(events);
  }

  // Properties
  get walls(): WallsRepository { return this._walls; }
  get doors(): DoorsRepository { return this._doors; }
  get windows(): WindowsRepository { return this._windows; }
  get rooms(): RoomsRepository { return this._rooms; }
  get importedDrawings(): ImportedDrawingRepository { return this._importedDrawings; }

  // Convenience methods
  get isEmpty(): boolean {
    return this._walls.isEmpty &&
           this._doors.isEmpty &&
           this._windows.isEmpty &&
           this._rooms.isEmpty &&
           this._importedDrawings.isEmpty;
  }

  clear(): void {
    this._walls.clear();
    this._doors.clear();
    this._windows.clear();
    this._rooms.clear();
    this._importedDrawings.clear();
  }

  dispose(): void {
    this.clear();
  }
}