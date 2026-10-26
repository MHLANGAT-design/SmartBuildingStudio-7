// src/modules/FloorPlanDesigner/Utils/FloorPlanCanvasElementParser.ts
import { store } from "@/Application/ConfigureStore";
import { DoorData } from "@/modules/FloorPlanDesigner/core/types/Door.types";

// Helper: Calculate area from points
function calculateAreaFromPoints(points: { x: number; y: number }[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2 / 1000000;
}

export function parseActiveLayers(activeDocumentState: any, plan: any, globalSelection: any) {
  const hiddenLayersMap = (window as any).__hiddenLayersMap || {};
  
  if (plan && (plan.elements || Array.isArray(plan.entities) || Array.isArray(plan.walls))) {
    const rawElements = plan.elements || plan.entities || plan.walls || [];
    return rawElements.filter((el: any) => !hiddenLayersMap[String(el.type || '').toLowerCase()]);
  }

  let rooms: any[] = [];
  let walls: any[] = [];
  let doors: any[] = [];
  let windows: any[] = [];

  if (Array.isArray(activeDocumentState)) {
    rooms = activeDocumentState;
  } else if (activeDocumentState) {
    const rawDoc = activeDocumentState.document || activeDocumentState.Document || activeDocumentState || {};
    rooms = rawDoc.rooms || rawDoc.Rooms || [];
    let box = rawDoc.drawnWallsJson || activeDocumentState.drawnWallsJson;
    if (typeof box === 'string') {
      try {
        box = JSON.parse(box);
      } catch (e) {}
    }
    if (box) {
      walls = box.walls || [];
      doors = box.doors || [];
      windows = box.windows || [];
    } else {
      walls = rawDoc.walls || [];
      doors = rawDoc.doors || [];
      windows = rawDoc.windows || [];
    }
  }

  const floorPlanState = store.getState().floorPlan || {};
  const reduxDoc = floorPlanState.document || {};
  if (walls.length === 0 && reduxDoc.walls?.length) walls = reduxDoc.walls;
  if (doors.length === 0 && reduxDoc.doors?.length) doors = reduxDoc.doors;
  if (windows.length === 0 && reduxDoc.windows?.length) windows = reduxDoc.windows;
  if (rooms.length === 0 && reduxDoc.rooms?.length) rooms = reduxDoc.rooms;

  const compiledElements: any[] = [];
  const selId = globalSelection
    ? String(globalSelection.id || globalSelection.data?.id || globalSelection.Id || '').trim()
    : '';

  // Parse Rooms
  if (!hiddenLayersMap['rooms']) {
    rooms.forEach((r: any) => {
      if (!r) return;
      const curId = String(r.id || r._id || '').trim();
      const isSelected = selId !== '' && curId !== '' && selId === curId;
      const pts = r.vertices || r.Vertices || r.points || [];
      const parsedPoints = pts.map((v: any) => ({ x: Number(v.x || 0), y: Number(v.y || 0) }));
      const area = calculateAreaFromPoints(parsedPoints);

      const baseObj = {
        ...r,
        type: 'room',
        id: r.id || r._id,
        Id: r.id || r._id,
        isRoom: true,
        name: r.name || 'Unnamed Room',
        targetLux: r.targetLux || 500,
        primaryGroup: r.primaryGroup || 1,
        area: area,
        isSelected,
        selected: isSelected,
        fillStyle: isSelected ? 'rgba(5, 255, 196, 0.25)' : r.fillStyle || 'rgba(74, 222, 128, 0.15)',
        strokeStyle: isSelected ? '#05FFC4' : r.strokeStyle || '#4ADE80',
        layer: 'rooms',
        points: parsedPoints,
        selectionPoints: parsedPoints,
        style: {
          strokeColor: isSelected ? '#05FFC4' : r.strokeStyle || '#4ADE80',
          fillColor: isSelected ? 'rgba(5, 255, 196, 0.25)' : r.fillStyle || 'rgba(74, 222, 128, 0.15)',
          strokeWidth: isSelected ? 3.5 : 1.5
        }
      };

      compiledElements.push({ ...baseObj, properties: { ...baseObj } });
    });
  }

  // Parse Walls
  if (!hiddenLayersMap['walls'] && !hiddenLayersMap['structural-layer']) {
    walls.forEach((w: any) => {
      if (!w) return;
      const curId = String(w.id || w._id || '').trim();
      const isSelected = selId !== '' && curId !== '' && selId === curId;

      const sx = Number(w.startX ?? w.X ?? w.x ?? 0);
      const sy = Number(w.startY ?? w.Y ?? w.y ?? 0);
      const ex = Number(w.endX ?? 0);
      const ey = Number(w.endY ?? 0);
      const thick = Number(w.thickness || 150);

      const wallAngle = Math.atan2(ey - sy, ex - sx);
      const perpAngle = wallAngle + Math.PI / 2;
      const offsetW = Math.max(thick / 2, 160);

      const boundingPolygon = [
        { x: sx + Math.cos(perpAngle) * offsetW, y: sy + Math.sin(perpAngle) * offsetW },
        { x: ex + Math.cos(perpAngle) * offsetW, y: ey + Math.sin(perpAngle) * offsetW },
        { x: ex - Math.cos(perpAngle) * offsetW, y: ey - Math.sin(perpAngle) * offsetW },
        { x: sx - Math.cos(perpAngle) * offsetW, y: sy - Math.sin(perpAngle) * offsetW }
      ];

      const baseObj = {
        ...w,
        type: 'Wall',
        id: w.id || w._id,
        Id: w.id || w._id,
        isSelected,
        selected: isSelected,
        style: {
          strokeColor: isSelected ? '#38BDF8' : w.style?.strokeColor || '#4B5563',
          strokeWidth: isSelected ? 4.5 : 2.5,
          fillColor: 'transparent'
        },
        points: [
          { x: sx, y: sy },
          { x: ex, y: ey }
        ],
        selectionPoints: boundingPolygon,
        startX: sx,
        startY: sy,
        endX: ex,
        endY: ey
      };

      compiledElements.push({ ...baseObj, properties: { ...baseObj } });
    });
  }

  // Parse Doors (Aligned strictly with Door.types DoorData interface)
  if (!hiddenLayersMap['doors']) {
    doors.forEach((d: any) => {
      if (!d) return;
      const curId = String(d.id || d._id || '').trim();
      const isSelected = selId !== '' && curId !== '' && selId === curId;

      const hingeX = Number(d.hingeX);
      const hingeY = Number(d.hingeY);
      const wallAngle = Number(d.wallAngle);
      const width = Number(d.width);
      const height = Number(d.height ?? 2100);

      // Derive end coordinate along the wall orientation vector for selection bounding
      const endX = hingeX + width * Math.cos(wallAngle);
      const endY = hingeY + width * Math.sin(wallAngle);

      const perpAngle = wallAngle + Math.PI / 2;
      const thicknessThreshold = 200;

      const selectionPoints = [
        { x: hingeX + Math.cos(perpAngle) * thicknessThreshold, y: hingeY + Math.sin(perpAngle) * thicknessThreshold },
        { x: endX + Math.cos(perpAngle) * thicknessThreshold, y: endY + Math.sin(perpAngle) * thicknessThreshold },
        { x: endX - Math.cos(perpAngle) * thicknessThreshold, y: endY - Math.sin(perpAngle) * thicknessThreshold },
        { x: hingeX - Math.cos(perpAngle) * thicknessThreshold, y: hingeY - Math.sin(perpAngle) * thicknessThreshold }
      ];

      const doorElement: DoorData = {
        id: String(d.id || d._id),
        type: 'Door',
        wallId: String(d.wallId || ''),
        hingeX,
        hingeY,
        wallAngle,
        width,
        height,
        isOutward: Boolean(d.isOutward),
        isLeftHand: Boolean(d.isLeftHand),
        name: d.name,
        properties: d.properties || {},
        isSelected,
        selected: isSelected,
        selectionPoints,
        style: {
          strokeColor: isSelected ? '#00FFC4' : d.style?.strokeColor || '#EAB308',
          fillColor: d.style?.fillColor || 'transparent',
          strokeWidth: isSelected ? 3.0 : d.style?.strokeWidth || 1.5,
          opacity: d.style?.opacity ?? 1
        }
      };

      compiledElements.push({ ...doorElement, properties: { ...doorElement } });
    });
  }

  // Parse Windows
  if (!hiddenLayersMap['windows']) {
    windows.forEach((wn: any) => {
      if (!wn) return;
      const curId = String(wn.id || wn._id || '').trim();
      const isSelected = selId !== '' && curId !== '' && selId === curId;
      const cx = Number(wn.startX ?? wn.x ?? 0);
      const cy = Number(wn.startY ?? wn.y ?? 0);
      const wWidth = Number(wn.width || 1200);
      const rex = Number(wn.endX ?? cx);
      const rey = Number(wn.endY ?? cy);

      const winAngle = Math.atan2(rey - cy, rex - cx);
      const perpAngle = winAngle + Math.PI / 2;
      const thicknessThreshold = 200;

      const boundingPolygon = [
        { x: cx + Math.cos(perpAngle) * thicknessThreshold, y: cy + Math.sin(perpAngle) * thicknessThreshold },
        { x: rex + Math.cos(perpAngle) * thicknessThreshold, y: rey + Math.sin(perpAngle) * thicknessThreshold },
        { x: rex - Math.cos(perpAngle) * thicknessThreshold, y: rey - Math.sin(perpAngle) * thicknessThreshold },
        { x: cx - Math.cos(perpAngle) * thicknessThreshold, y: cy - Math.sin(perpAngle) * thicknessThreshold }
      ];

      const baseObj = {
        ...wn,
        type: 'Window',
        id: wn.id || wn._id,
        isSelected,
        selected: isSelected,
        start: { x: cx, y: cy },
        end: { x: rex, y: rey },
        startX: cx,
        startY: cy,
        endX: rex,
        endY: rey,
        width: wWidth,
        style: {
          strokeColor: isSelected ? '#60A5FA' : wn.style?.strokeColor || '#38BDF8',
          fillColor: 'transparent',
          strokeWidth: isSelected ? 3.0 : 1.5
        },
        points: [
          { x: cx, y: cy },
          { x: rex, y: rey }
        ],
        selectionPoints: boundingPolygon
      };

      compiledElements.push({ ...baseObj, properties: { ...baseObj } });
    });
  }

  return compiledElements;
}

export default parseActiveLayers;