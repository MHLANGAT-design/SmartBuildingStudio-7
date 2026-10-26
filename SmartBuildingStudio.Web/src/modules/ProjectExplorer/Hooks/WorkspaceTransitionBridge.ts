// src/modules/ProjectExplorer/Hooks/WorkspaceTransitionBridge.ts
// Mode Isolated Firewall (Protects the Import track)
import { store } from "@/Application/ConfigureStore";
import { setDocument, setDocumentMetadata } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

interface TransitionNode {
  id: string;
  name?: string;
  type?: string;
  nodeType?: string;
  parentId?: string;
  [key: string]: any;
}

export class WorkspaceTransitionBridge {
  private static instance: WorkspaceTransitionBridge;

  private constructor() {}

  public static getInstance(): WorkspaceTransitionBridge {
    if (!WorkspaceTransitionBridge.instance) {
      WorkspaceTransitionBridge.instance = new WorkspaceTransitionBridge();
    }
    return WorkspaceTransitionBridge.instance;
  }

  public async execute(node: TransitionNode, dispatch: any, getState?: any): Promise<void> {
    const queryParams = new URLSearchParams(window.location.search);
    const currentMode = queryParams.get('mode') || (window as any).__designerMode || 'floorplans';

    // 🚀 THE IMPORT MODE PROTECTION FIREWALL:
    // If we are currently inside the Import track, do NOT allow the bridge to run metadata transitions.
    // This stops it from overwriting our fresh session initialization tokens.
    if (currentMode === 'import') {
      console.log('[WorkspaceTransitionBridge] 🛡️ Import Mode active. Skipping metadata overwrite pass.');
      return;
    }

    console.log('[WorkspaceTransitionBridge] Executing transition for node:', node.id, node.name);
    try {
      const documentId = node.id || (node as any).Id;
      
      const metadataPayload = {
        id: documentId,
        name: node.name || node.Name || 'Untitled Document',
        nodeType: node.nodeType || node.type || 'Document',
        nodeParentId: node.parentId || node.ParentId || null,
        buildingId: node.buildingId || node.BuildingId || null,
        floorId: node.floorId || node.FloorId || null,
        projectId: node.projectId || node.ProjectId || null,
        activeProjectName: node.activeProjectName || node.ActiveProjectName,
        activeBuildingName: node.activeBuildingName || node.ActiveBuildingName,
        activeFloorName: node.activeFloorName || node.ActiveFloorName,
        activeDocumentName: node.name || node.Name,
        level: node.level || node.Level || 0
      };

      dispatch(setDocumentMetadata(metadataPayload));

      (window as any).__floorPlanActiveDocumentInstance = {
        ...(window as any).__floorPlanActiveDocumentInstance,
        id: documentId,
        name: node.name || node.Name,
        nodeType: node.nodeType || node.type,
        nodeParentId: node.parentId || node.ParentId,
        buildingId: node.buildingId || node.BuildingId,
        floorId: node.floorId || node.FloorId,
        projectId: node.projectId || node.ProjectId,
        level: node.level || node.Level || 0,
        activeDocumentName: node.name || node.Name
      };

      (window as any).__activeDocumentId = documentId;
      
      window.dispatchEvent(new CustomEvent('sbs:canvas-update'));
      window.dispatchEvent(new CustomEvent('canvas-invalidate'));
    } catch (error) {
      console.error('[WorkspaceTransitionBridge] Transition failed:', error);
    }
  }

  public setDocumentData(documentData: any, dispatch: any): void {
    const queryParams = new URLSearchParams(window.location.search);
    const currentMode = queryParams.get('mode') || (window as any).__designerMode || 'floorplans';

    // 🚀 THE IMPORT DATA PROTECTION FIREWALL:
    // Completely bars data loading if the canvas route is running on an active file picker ingestion.
    if (currentMode === 'import') {
      console.log('[WorkspaceTransitionBridge] 🛡️ Import Mode active. Blocking database data sync injection.');
      return;
    }

    console.log('[WorkspaceTransitionBridge] Setting document data:', documentData);
    const parsedData = this.parseDocumentData(documentData);
    
    dispatch(setDocument(parsedData));
    
    (window as any).__floorPlanActiveDocumentInstance = {
      ...(window as any).__floorPlanActiveDocumentInstance,
      ...parsedData
    };
    (window as any).__activeDocumentId = parsedData.id;

    // Force-sync coordinates to background canvas calculation caches for Edit Mode rendering
    const rawVectors = parsedData.importedDrawings?.length ? parsedData.importedDrawings : parsedData.walls;
    if (Array.isArray(rawVectors) && rawVectors.length > 0) {
      (window as any).__persistentDwgVectorBackupCache = [...rawVectors];
    }

    window.dispatchEvent(new CustomEvent('sbs:canvas-update'));
    window.dispatchEvent(new CustomEvent('canvas-invalidate'));
  }

  private parseDocumentData(data: any): any {
    const document = data.document || data || {};
    
    let drawnWalls: any = {};
    if (document.DrawnWallsJson) {
      try {
        drawnWalls = typeof document.DrawnWallsJson === 'string'
          ? JSON.parse(document.DrawnWallsJson)
          : document.DrawnWallsJson;
      } catch (e) {
        console.warn('[WorkspaceTransitionBridge] Failed to parse DrawnWallsJson:', e);
        drawnWalls = {};
      }
    }

    let rooms: any[] = [];
    if (document.DefinedRoomsJson) {
      try {
        rooms = typeof document.DefinedRoomsJson === 'string'
          ? JSON.parse(document.DefinedRoomsJson)
          : document.DefinedRoomsJson;
      } catch (e) {
        console.warn('[WorkspaceTransitionBridge] Failed to parse DefinedRoomsJson:', e);
        rooms = [];
      }
    }

    let fixtures: any = {};
    if (document.PlacedFixturesJson) {
      try {
        fixtures = typeof document.PlacedFixturesJson === 'string'
          ? JSON.parse(document.PlacedFixturesJson)
          : document.PlacedFixturesJson;
      } catch (e) {
        console.warn('[WorkspaceTransitionBridge] Failed to parse PlacedFixturesJson:', e);
        fixtures = {};
      }
    }

    const baseWalls = drawnWalls.walls || [];
    const baseDoors = drawnWalls.doors || [];
    const baseWindows = drawnWalls.windows || [];
    const baseRooms = rooms || [];
    const baseDrawings = fixtures.importedDrawings || [];

    // Safe coordinate mappings for FloorPlanDesigner extraction cycles
    return {
      id: document.id || document.Id || document._id,
      name: document.Name || document.name || 'Untitled',
      
      walls: baseWalls.map((w: any) => ({
        id: w.id || `wall-${Math.random()}`,
        startX: w.startX ?? w.start?.x ?? 0,
        startY: w.startY ?? w.start?.y ?? 0,
        endX: w.endX ?? w.end?.x ?? 100,
        endY: w.endY ?? w.end?.y ?? 100,
        thickness: w.thickness || 200,
        height: w.height || 2800,
        material: w.material || 'Concrete'
      })),

      doors: baseDoors.map((d: any) => {
        const rawX = d.x ?? d.X ?? d.position?.x ?? d.startX ?? 0;
        const rawY = d.y ?? d.Y ?? d.position?.y ?? d.startY ?? 0;
        return {
          id: d.id || `door-${Math.random()}`,
          x: rawX,
          y: rawY,
          startX: rawX,
          startY: rawY,
          width: d.width ?? d.Width ?? 900,
          height: d.height ?? d.Height ?? 2100,
          type: d.type ?? d.Type ?? d.doorType || 'Door',
          swingType: d.swingType || d.swing || 'Single Swing'
        };
      }),

      windows: baseWindows.map((w: any) => {
        const rawX = w.x ?? w.X ?? w.position?.x ?? w.startX ?? 0;
        const rawY = w.y ?? w.Y ?? w.position?.y ?? w.startY ?? 0;
        return {
          id: w.id || `window-${Math.random()}`,
          x: rawX,
          y: rawY,
          startX: rawX,
          startY: rawY,
          width: w.width ?? w.Width ?? 1200,
          height: w.height ?? w.Height ?? 1200,
          type: w.type ?? w.Type || 'Window',
          transmittance: w.transmittance || 0.75
        };
      }),

      rooms: baseRooms.map((r: any) => ({
        id: r.id || `room-${Math.random()}`,
        name: r.name || r.Name || 'Room',
        points: (r.points || r.Points || r.vertices || []).map((p: any) => ({ x: p.x ?? p.X ?? 0, y: p.y ?? p.Y ?? 0 })),
        targetLux: r.targetLux ?? 500,
        primaryGroup: r.primaryGroup ?? 1
      })),

      importedDrawings: baseDrawings.map((d: any) => ({
        id: d.id || `drawing-${Math.random()}`,
        name: d.name || d.activeDocumentName || 'Imported Drawing',
        fileName: d.fileName || d.name || 'Imported Drawing',
        sourceFile: d.sourceFile || d.fileName || 'Imported Drawing',
        activeProjectName: d.activeProjectName,
        activeBuildingName: d.activeBuildingName,
        activeFloorName: d.activeFloorName,
        activeDocumentName: d.activeDocumentName,
        importedAt: d.importedAt || new Date().toISOString(),
        wallsCount: d.wallsCount || 0,
        x: d.x ?? d.X ?? 0,
        y: d.y ?? d.Y ?? 0,
        width: d.width ?? d.Width ?? 0,
        height: d.height ?? d.Height ?? 0,
        opacity: d.opacity ?? 0.5,
        visible: d.visible !== undefined ? d.visible : true
      })),
      electricalFixtures: (fixtures.electricalFixtures || []).map((f: any) => ({
        id: f.id || `fixture-${Math.random()}`,
        type: f.type || 'Unknown',
        x: f.x ?? f.X ?? 0,
        y: f.y ?? f.Y ?? 0,
        properties: f.properties || {}
      })),
      activeProjectName: document.activeProjectName || document.ActiveProjectName,
      activeBuildingName: document.activeBuildingName || document.ActiveBuildingName,
      activeFloorName: document.activeFloorName || document.ActiveFloorName,
      activeDocumentName: document.Name || document.name,
      PixelsToMetresScale: document.PixelsToMetresScale || 1
    };
  }
}

export const workspaceTransitionBridge = WorkspaceTransitionBridge.getInstance();
export default WorkspaceTransitionBridge;