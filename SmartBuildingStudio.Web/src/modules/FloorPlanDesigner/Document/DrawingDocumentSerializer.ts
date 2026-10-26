// src/modules/FloorPlanDesigner/Document/DrawingDocumentSerializer.ts
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";
import type { FloorPlanDocumentDto } from "@/modules/FloorPlanDesigner/Store/FloorPlanDocumentDto";
import { store } from "@/Application/ConfigureStore";
import { DoorData } from "@/modules/FloorPlanDesigner/core/types/Door.types";

export class DrawingDocumentSerializer {
  /**
   * serialize
   * Computes georeferenced coordinates for openings and serializes them using canonical DoorData attributes.
   */
  static serialize(doc: any): FloorPlanDocumentDto {
    if (!doc) {
      throw new Error("[Serializer] Serialization aborted: Target document is unassigned.");
    }
    const documentId = typeof doc.getId === "function" ? doc.getId() : (doc.id || doc.documentId);
    console.log("[Serializer] Tracking absolute UTM positions for document:", documentId);

    const state = store.getState();
    const floorPlan = state.floorPlan || {};
    const reduxDoc = floorPlan.document || {};

    const walls = typeof doc.getWalls === "function" ? doc.getWalls() : (doc.walls || doc._walls || []);
    const doors: DoorData[] = typeof doc.getDoors === "function" ? doc.getDoors() : (doc.doors || doc._doors || []);
    const windows = typeof doc.getWindows === "function" ? doc.getWindows() : (doc.windows || doc._windows || []);
    const rooms = typeof doc.getRooms === "function" ? doc.getRooms() : (doc.rooms || doc._rooms || []);
    const importedDrawings = typeof doc.getImportedDrawings === "function" ? doc.getImportedDrawings() : (doc.importedDrawings || doc._importedDrawings || []);

    const activeProjectName = doc.activeProjectName || reduxDoc.activeProjectName || "Unknown Project";
    const activeBuildingName = doc.activeBuildingName || reduxDoc.activeBuildingName || "Unknown Building";
    const activeFloorName = doc.activeFloorName || reduxDoc.activeFloorName || "Unknown Floor";
    const activeDocumentName = doc.activeDocumentName || reduxDoc.activeDocumentName || doc.name || "Untitled Layout";
    const metadata = typeof doc.getMetadata === "function" ? doc.getMetadata() : (doc.metadata || {});

    // Fast-lookup map for wall geometry definitions in memory
    const wallsMap = new Map<string, any>();
    walls.forEach((w: any) => {
      if (w && w.id) {
        wallsMap.set(String(w.id), w);
      }
    });

    const drawnWalls = {
      walls: walls.map((w: any) => ({
        id: w.id || `wall-${Math.random()}`,
        startX: w.startX ?? w.start?.x ?? 0,
        startY: w.startY ?? w.start?.y ?? 0,
        endX: w.endX ?? w.end?.x ?? 100,
        endY: w.endY ?? w.end?.y ?? 0,
        thickness: w.thickness || w.Thickness || 200,
        height: w.height || w.Height || 2800,
        material: w.material || w.Material || "Concrete",
        style: w.style || { strokeColor: "#4B5563", strokeWidth: 2, opacity: 1 }
      })),

      // 🎯 DOOR SERIALIZATION PASS (Canonical DoorData integration)
      doors: doors.map((d: DoorData | any) => {
        let hingeX = d.hingeX ?? d.x ?? d.startX ?? 0;
        let hingeY = d.hingeY ?? d.y ?? d.startY ?? 0;
        const parentWall = d.wallId ? wallsMap.get(String(d.wallId)) : null;

        if (hingeX === 0 && hingeY === 0 && parentWall) {
          const wStartX = parentWall.startX ?? parentWall.start?.x ?? 0;
          const wStartY = parentWall.startY ?? parentWall.start?.y ?? 0;
          const wEndX = parentWall.endX ?? parentWall.end?.x ?? 0;
          const wEndY = parentWall.endY ?? parentWall.end?.y ?? 0;
          
          const offsetRatio = d.offset ?? d.Offset ?? d.ratio ?? 0.5;
          hingeX = wStartX + (wEndX - wStartX) * offsetRatio;
          hingeY = wStartY + (wEndY - wStartY) * offsetRatio;
        }

        // Derive swing flags from legacy quadrant data if not explicitly provided
        const rawQuad = String(d.swingQuadrant || d.swingQuadrantAngle || 'UR').toUpperCase();
        const isOutward = d.isOutward !== undefined ? Boolean(d.isOutward) : ['UR', 'DR'].includes(rawQuad);
        const isLeftHand = d.isLeftHand !== undefined ? Boolean(d.isLeftHand) : ['UL', 'DL'].includes(rawQuad);

        return {
          id: d.id || `door-${Math.random()}`,
          type: "Door",
          wallId: d.wallId || "",
          hingeX,
          hingeY,
          wallAngle: d.wallAngle ?? 0,
          width: d.width || 900,
          height: d.height || 2100,
          isOutward,
          isLeftHand,
          name: d.name,
          properties: d.properties || {},
          style: d.style || { strokeColor: "#10B981", strokeWidth: 1.5, opacity: 1 }
        };
      }),

      windows: windows.map((w: any) => {
        let resolvedX = w.x ?? w.X ?? w.position?.x ?? w.startX ?? 0;
        let resolvedY = w.y ?? w.Y ?? w.position?.y ?? w.startY ?? 0;
        const parentWall = w.wallId ? wallsMap.get(String(w.wallId)) : null;

        if (resolvedX === 0 && resolvedY === 0 && parentWall) {
          const wStartX = parentWall.startX ?? parentWall.start?.x ?? 0;
          const wStartY = parentWall.startY ?? parentWall.start?.y ?? 0;
          const wEndX = parentWall.endX ?? parentWall.end?.x ?? 0;
          const wEndY = parentWall.endY ?? parentWall.end?.y ?? 0;
          
          const offsetRatio = w.offset ?? w.Offset ?? w.ratio ?? 0.5;
          resolvedX = wStartX + (wEndX - wStartX) * offsetRatio;
          resolvedY = wStartY + (wEndY - wStartY) * offsetRatio;
        }

        return {
          id: w.id || `window-${Math.random()}`,
          wallId: w.wallId || "",
          x: resolvedX,
          y: resolvedY,
          startX: resolvedX,
          startY: resolvedY,
          width: w.width || w.Width || 1200,
          height: w.height || w.Height || 1500,
          transmittance: w.transmittance ?? w.Transmittance ?? 0.75,
          style: w.style || { strokeColor: "#38BDF8", strokeWidth: 1.5, opacity: 1 }
        };
      })
    };

    const definedRooms = rooms.map((r: any) => ({
      id: r.id || `room-${Math.random()}`,
      name: r.name || r.Name || "Unnamed Room",
      vertices: (r.vertices || r.points || r.Points || []).map((v: any) => ({ x: v.x ?? v.X ?? 0, y: v.y ?? v.Y ?? 0 })),
      targetLux: r.targetLux ?? 500,
      spaceType: r.spaceType || "Office",
      primaryGroup: r.primaryGroup ?? r.PrimaryGroup ?? 1,
      area: r.area || 0,
      style: r.style || { strokeColor: "#8B5CF6", fillColor: "rgba(139, 92, 246, 0.08)", strokeWidth: 1.5, opacity: 1 }
    }));

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasWallData = false;
    for (const w of walls) {
      const sx = w.startX ?? w.start?.x ?? 0; const sy = w.startY ?? w.start?.y ?? 0;
      const ex = w.endX ?? w.end?.x ?? 0; const ey = w.endY ?? w.end?.y ?? 0;
      if (sx !== 0 || sy !== 0 || ex !== 0 || ey !== 0) {
        minX = Math.min(minX, sx, ex); minY = Math.min(minY, sy, ey);
        maxX = Math.max(maxX, sx, ex); maxY = Math.max(maxY, sy, ey);
        hasWallData = true;
      }
    }

    const placedFixtures = {
      importedDrawings: importedDrawings.map((d: any) => {
        let startX = d.startX ?? d.offsetX ?? d.x ?? 0;
        let startY = d.startY ?? d.offsetY ?? d.y ?? 0;
        let endX = d.endX ?? (d.width ? startX + d.width : 0);
        let endY = d.endY ?? (d.height ? startY + d.height : 0);
        const isDefaultBounds = (startX === 0 && startY === 0 && endX === 100 && endY === 100) || (startX === 0 && startY === 0 && endX === 0 && endY === 0);
        if (isDefaultBounds && hasWallData && minX < Infinity) {
          startX = minX; startY = minY; endX = maxX; endY = maxY;
        }
        if (startX === 0 && startY === 0 && endX === 0 && endY === 0) {
          endX = 100; endY = 100;
        }
        return {
          id: d.id || `drawing-${Math.random()}`,
          fileName: d.fileName || d.name || "blueprint.dwg",
          fileSize: d.fileSize || 0,
          scaleFactor: d.scaleFactor || 1.0,
          offsetX: d.offsetX ?? d.x ?? startX,
          offsetY: d.offsetY ?? d.y ?? startY,
          rotationDegrees: d.rotationDegrees || 0,
          opacity: d.opacity ?? 0.5,
          startX: startX, startY: startY, endX: endX, endY: endY,
          width: endX - startX, height: endY - startY,
        };
      }),
      electricalFixtures: []
    };

    return {
      id: documentId,
      name: activeDocumentName,
      activeProjectId: doc.activeProjectId || metadata.activeProjectId || undefined,
      activeProjectName: activeProjectName,
      activeBuildingId: doc.activeBuildingId || metadata.activeBuildingId || undefined,
      activeBuildingName: activeBuildingName,
      activeFloorId: doc.activeFloorId || metadata.activeFloorId || undefined,
      activeFloorName: activeFloorName,
      activeDocumentName: activeDocumentName,
      drawnWallsJson: JSON.stringify(drawnWalls),
      definedRoomsJson: JSON.stringify(definedRooms),
      placedFixturesJson: JSON.stringify(placedFixtures),
      createdAt: metadata.createdAt || new Date().toISOString(),
      lastModified: metadata.lastModified || new Date().toISOString(),
      version: metadata.version || 1
    };
  }
}
export default DrawingDocumentSerializer;