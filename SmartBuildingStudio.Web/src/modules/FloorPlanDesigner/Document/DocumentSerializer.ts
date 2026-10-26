// DocumentSerializer.ts (Part 1 Fixed) in C:\Users\Tif\Documents\Smart Building Studio\SmartBuildingStudio.Web\src\modules\FloorPlanDesigner\Document;
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";
import { 
  ComprehensiveUpdateFloorPlanPayloadDto, FloorLevelDto, DrawingLayerDto, 
  ImportedDrawingDto, BackendWallDto, BackendRoomDto, BackendDoorDto, BackendWindowDto 
} from "@/modules/FloorPlanDesigner/Store/FloorPlanBackendContracts";
import { DoorFactory } from "@/modules/FloorPlanDesigner/Factories/DoorFactory";
import { WindowFactory } from "@/modules/FloorPlanDesigner/Factories/WindowFactory";
import { RoomFactory } from "@/modules/FloorPlanDesigner/Factories/RoomFactory";

export class DocumentSerializer {
  public static readonly FORMAT_VERSION = 1;

  public static serialize(doc: any): ComprehensiveUpdateFloorPlanPayloadDto {
    if (!doc) throw new Error("[Serializer] Source document context is undefined.");

    // 🚀 FIXED: Polyfill fallback extraction logic handles both class instances and plain objects
    const metadata = typeof doc.getMetadata === "function" ? doc.getMetadata() : (doc.metadata || doc);
    const docUnits = typeof doc.getUnits === "function" ? doc.getUnits() : (doc.units || "mm");

    const toArr = (s: any) => {
      if (!s) return [];
      if (typeof s.values === "function") return Array.from(s.values());
      return Array.isArray(s) ? s : [];
    };

    const sourceLayers = typeof doc.getLayers === "function" ? doc.getLayers() : (doc.layers || []);
    const layersPayload: DrawingLayerDto[] = toArr(sourceLayers).map((layer: any, idx) => ({
      id: layer.id || `layer-${idx}`, 
      name: typeof layer.getName === "function" ? layer.getName() : (layer.name || "Layer"), 
      visible: typeof layer.isVisible === "function" ? layer.isVisible() : (layer.visible ?? true), 
      locked: typeof layer.isLocked === "function" ? layer.isLocked() : (layer.locked ?? false), 
      order: idx
    }));

    const sourceDrawings = typeof doc.getImportedDrawings === "function" ? doc.getImportedDrawings() : (doc.importedDrawings || []);
    const importedDrawingsPayload: ImportedDrawingDto[] = toArr(sourceDrawings).map((img: any) => ({
      id: typeof img.getId === "function" ? img.getId() : (img.id || "dwg-ref"), 
      fileName: img.fileName || "template.png", 
      fileSizeNumber: img.fileSize || 0,
      scaleFactor: img.scaleFactor || 1.0, 
      offsetX: img.offsetX || 0, 
      offsetY: img.offsetY || 0,
      rotationDegrees: img.rotationDegrees || img.rotation || 0, 
      opacity: img.opacity || 0.5,
      startX: img.start?.x ?? img.startX ?? 0, 
      startY: img.start?.y ?? img.startY ?? 0,
      endX: img.end?.x ?? img.endX ?? 0, 
      endY: img.end?.y ?? img.endY ?? 0
    }));

    const currentFloorId = doc.activeFloorld || doc.floorId || "floor-ground";
    
    const sourceWalls = typeof doc.getWalls === "function" ? doc.getWalls() : (doc.walls || []);
    const sourceRooms = typeof doc.getRooms === "function" ? doc.getRooms() : (doc.rooms || []);
    const sourceDoors = typeof doc.getDoors === "function" ? doc.getDoors() : (doc.doors || []);
    const sourceWindows = typeof doc.getWindows === "function" ? doc.getWindows() : (doc.windows || []);

    const floorsPayload: FloorLevelDto[] = [{
      id: currentFloorId, 
      name: doc.activeFloorName || doc.floorName || "Ground Level", 
      levelIndex: 0, 
      elevationHeightMeters: 3.0,
      walls: toArr(sourceWalls).map((w: any) => ({
        id: typeof w.getId === "function" ? w.getId() : (w.id || "wall"), 
        floorld: currentFloorId, 
        startX: w.startX ?? w.start?.x, 
        startY: w.startY ?? w.start?.y,
        endX: w.endX ?? w.end?.x, 
        endY: w.endY ?? w.end?.y, 
        thickness: w.thickness || w.Thickness || 200, 
        material: w.material || "Concrete",
        style: { strokeColor: w.style?.strokeColor || "#4B5563", fillColor: "transparent", strokeWidth: 2, opacity: 1 }
      })),
      rooms: toArr(sourceRooms).map((r: any) => ({
        id: typeof r.getId === "function" ? r.getId() : (r.id || "room"), 
        floorld: currentFloorId, 
        name: r.name || "Zone", 
        targetLux: r.targetLux || r.requiredLux || 500,
        primaryGroup: r.primaryGroup || 0, 
        vertexPoints: r.vertexPoints || r.vertices || [],
        style: { strokeColor: "#8B5CF6", fillColor: "rgba(139, 92, 246, 0.08)", strokeWidth: 1.5, opacity: 1 }
      })),
      doors: toArr(sourceDoors).map((d: any) => ({
        id: typeof d.getId === "function" ? d.getId() : (d.id || "door"), 
        wallld: d.wallId || d.wallld || "", 
        floorld: currentFloorId, 
        width: d.width || 900, 
        doorType: d.doorType || "Single Swing",
        style: { strokeColor: "#10B981", fillColor: "transparent", strokeWidth: 1.5, opacity: 1 }
      })),
      windows: toArr(sourceWindows).map((win: any) => ({
        id: typeof win.getId === "function" ? win.getId() : (win.id || "window"), 
        wallld: win.wallId || win.wallld || "", 
        floorld: currentFloorId, 
        width: win.width || 1200, 
        transmittance: win.transmittance || 0.75,
        style: { strokeColor: "#38BDF8", fillColor: "rgba(56, 189, 248, 0.1)", strokeWidth: 1.5, opacity: 1 }
      }))
    }];

    return {
      name: metadata.name || "Layout Blueprint",
      pixelsToMetresScale: Number((window as any).__sbsCalibrationScaleFactor ?? 1.0),
      activeFloorld: currentFloorId, 
      layers: layersPayload,
      importedDrawings: importedDrawingsPayload, 
      imported_drawings: importedDrawingsPayload, 
      importeddrawings: importedDrawingsPayload,
      floors: floorsPayload, 
      activeProjectId: doc.activeProjectId || doc.projectId || doc.activeProjectid, 
      activeProjectName: doc.activeProjectName,
      activeBuildingId: doc.activeBuildingId || doc.buildingId || doc.activeBuildingld, 
      activeBuildingName: doc.activeBuildingName,
      activeFloorName: doc.activeFloorName, 
      activeDocumentName: doc.activeDocumentName || metadata.name
    } as any;
  }
// DocumentSerializer.ts (Part 2 Fixed) in C:\Users\Tif\Documents\Smart Building Studio\SmartBuildingStudio.Web\src\modules\FloorPlanDesigner\Document;

  public static deserialize(rawDto: any): DrawingDocument {
    if (!rawDto) return new DrawingDocument();
    const ctx = rawDto?.document || rawDto?.data || rawDto?.payload || rawDto;

    const doc = new DrawingDocument({
      metadata: { id: ctx.id || ctx.documentId || "active-canvas", name: ctx.name || ctx.activeDocumentName || "Studio Layout" },
      units: ctx.units || "mm",
      activeProjectId: ctx.activeProjectId || ctx.activeProjectid, activeProjectName: ctx.activeProjectName,
      activeBuildingld: ctx.activeBuildingId || ctx.activeBuildingld, activeBuildingName: ctx.activeBuildingName,
      activeFloorld: ctx.activeFloorld || ctx.activeFloorId, activeFloorName: ctx.activeFloorName,
      activeDocumentName: ctx.activeDocumentName || ctx.name
    });

    const nested = ctx.floors?.[0] || {};
    const rawDrawings = ctx.importedDrawings || ctx.imported_drawings || ctx.importeddrawings || nested.importedDrawings || [];
    const rawWalls = ctx.walls || nested.walls || [];
    const rawDoors = ctx.doors || nested.doors || [];
    const rawWindows = ctx.windows || nested.windows || [];
    const rawRooms = ctx.rooms || nested.rooms || [];

    rawDrawings.forEach((img: any, idx: number) => {
      if (img && typeof doc.addImportedDrawing === "function") {
        doc.addImportedDrawing({
          id: img.id || `recovered-vector-${idx}`, fileName: img.fileName || "template.png",
          scaleFactor: img.scaleFactor || 1.0, offsetX: img.offsetX || 0, offsetY: img.offsetY || 0,
          rotationDegrees: img.rotationDegrees || img.rotation || 0, opacity: img.opacity || 0.5,
          start: img.start || { x: img.startX || 0, y: img.startY || 0 }, end: img.end || { x: img.endX || 0, y: img.endY || 0 },
          getId: () => img.id || `recovered-vector-${idx}`, getPosition: () => ({ x: img.offsetX || 0, y: img.offsetY || 0 })
        } as any);
      }
    });

    rawWalls.forEach((w: any) => {
      if (w && typeof doc.addWall === 'function') {
        doc.addWall({ ...w, getId: () => w.id, getStartPoint: () => w.start || { x: w.startX, y: w.startY }, getEndPoint: () => w.end || { x: w.endX, y: w.endY } } as any);
      }
    });

    rawDoors.forEach((d: any) => {
      if (d && typeof doc.addDoor === 'function') {
        const instance = DoorFactory.create({ position: d.position || d.start, endPosition: d.endPosition || d.end, wallId: d.wallId || d.wallld });
        Object.assign(instance, d); doc.addDoor(instance);
      }
    });

    rawWindows.forEach((wi: any) => {
      if (wi && typeof doc.addWindow === 'function') {
        const instance = WindowFactory.create({ position: wi.position || wi.start, endPosition: wi.endPosition || wi.end, wallId: wi.wallId || wi.wallld });
        Object.assign(instance, wi); doc.addWindow(instance);
      }
    });

    rawRooms.forEach((r: any) => {
      if (r && typeof doc.addRoom === 'function') {
        const instance = RoomFactory.create({ vertices: r.vertexPoints || r.vertices || [] });
        Object.assign(instance, r); doc.addRoom(instance);
      }
    });

    return doc;
  }
}
export default DocumentSerializer;
