// src/modules/FloorPlanDesigner/Utils/doorScanner.ts

export interface DoorPayload {
  id: string;
  type: string;
  name: string;
  wallId: string;
  hingeX: number;
  hingeY: number;
  wallAngle: number;
  width: number;
  height: number;
  isOutward: boolean;
  isLeftHand: boolean;
  style: Record<string, any>;
}

function normalizeAngle(rad: number): number {
  const twoPi = Math.PI * 2;
  let angle = rad % twoPi;
  return angle < 0 ? angle + twoPi : angle;
}

function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function getAbsoluteCoords(obj: any, pointType: 'start' | 'end' | 'center'): { x: number; y: number } {
  if (typeof obj.getAbsolutePosition === 'function') {
    const pos = obj.getAbsolutePosition();
    return { x: pos.x, y: pos.y };
  }

  const parentX = obj.group?.x || obj.parent?.x || 0;
  const parentY = obj.group?.y || obj.parent?.y || 0;

  if (pointType === 'start') {
    return { x: (obj.x1 ?? obj.x ?? 0) + parentX, y: (obj.y1 ?? obj.y ?? 0) + parentY };
  } else if (pointType === 'end') {
    return { x: (obj.x2 ?? obj.x ?? 0) + parentX, y: (obj.y2 ?? obj.y ?? 0) + parentY };
  }
  return { x: (obj.x ?? 0) + parentX, y: (obj.y ?? 0) + parentY };
}

/**
 * Purges orange component overlays and triangular topology markers, 
 * returning only clean CAD vector primitives.
 */
export function purgeDuplicateDoorOverlays(canvasObjects: any[]): any[] {
  return canvasObjects.filter(obj => {
    // 1. Remove Orange Door Component Overlays
    const isOrangeOverlay = 
      obj.type === 'Door' || 
      obj.isDoorOverlay || 
      (obj.style && (obj.style.strokeColor === '#EAB308' || obj.style.strokeColor === 'orange'));

    // 2. Remove Triangular / Marker Debug Entities
    const isTriangularMarker = 
      obj.isMarker || 
      obj.isTopologyDebug || 
      obj.type === 'triangle' || 
      (obj.tags && obj.tags.includes('marker')) ||
      (obj.id && String(obj.id).startsWith('py_ent_'));

    return !isOrangeOverlay && !isTriangularMarker;
  });
}

/**
 * Scans canvas door elements (both groups and blue raw line/arc primitives)
 * and generates exact geometric payloads.
 */
export function scanCanvasDoors(canvasObjects: any[], wallObjects: any[]): DoorPayload[] {
  const doorPayloads: DoorPayload[] = [];
  const processedObjectIds = new Set<string>();

  // Filter out orange/triangular overlays before processing
  const cleanObjects = purgeDuplicateDoorOverlays(canvasObjects);

  // 1. Process Grouped / Tagged Doors
  const groupedDoors = cleanObjects.filter(obj => 
    obj.isDoorGroup || (obj.tags && obj.tags.includes('door'))
  );

  groupedDoors.forEach((door, index) => {
    if (door.id) processedObjectIds.add(door.id);

    let hingeX = 0, hingeY = 0;
    let width = 900;
    let wallAngle = 0;
    let isLeftHand = false;
    let isOutward = false;

    if (typeof door.getChildren === 'function') {
      const children = door.getChildren();
      const line = children.find((c: any) => c.type === 'line' || c.type === 'Line' || c.isPanel);
      const arc = children.find((c: any) => c.type === 'arc' || c.type === 'Arc' || c.type === 'path' || c.isSwing);

      if (line && arc) {
        const p1 = getAbsoluteCoords(line, 'start');
        const p2 = getAbsoluteCoords(line, 'end');
        const arcCenter = getAbsoluteCoords(arc, 'center');

        const dist1 = Math.hypot(p1.x - arcCenter.x, p1.y - arcCenter.y);
        const dist2 = Math.hypot(p2.x - arcCenter.x, p2.y - arcCenter.y);

        const hinge = dist1 < dist2 ? p1 : p2;
        const leafEnd = dist1 < dist2 ? p2 : p1;

        hingeX = hinge.x;
        hingeY = hinge.y;

        const vx = leafEnd.x - hinge.x;
        const vy = leafEnd.y - hinge.y;
        width = Math.hypot(vx, vy);
        wallAngle = Math.atan2(vy, vx);

        const ax = arcCenter.x - hinge.x;
        const ay = arcCenter.y - hinge.y;

        isLeftHand = ((vx * ay) - (vy * ax)) > 0;
        isOutward = ((vx * ax) + (vy * ay)) >= 0;
      }
    } else {
      hingeX = door.x ?? door.hingeX ?? 0;
      hingeY = door.y ?? door.hingeY ?? 0;
      width = door.width ?? 900;
      wallAngle = door.rotation ?? door.wallAngle ?? 0;

      const scaleX = door.scaleX ?? 1;
      const scaleY = door.scaleY ?? 1;

      isLeftHand = scaleX < 0;
      isOutward = scaleY < 0;
    }

    doorPayloads.push(buildDoorPayload(
      door.id || `door-group-${index + 1}`,
      index + 1,
      hingeX, hingeY,
      wallAngle, width,
      door.height || 2100.0,
      isOutward, isLeftHand,
      door.style,
      wallObjects
    ));
  });

  // 2. Process Raw Blue Line + Arc Primitives
  const unmappedLines = cleanObjects.filter(obj => 
    !processedObjectIds.has(obj.id) && 
    (obj.type === 'line' || obj.type === 'Line') &&
    !obj.isWall
  );
  
  const unmappedArcs = cleanObjects.filter(obj => 
    !processedObjectIds.has(obj.id) && 
    (obj.type === 'arc' || obj.type === 'Arc' || obj.type === 'path')
  );

  let unmappedCount = doorPayloads.length;

  unmappedLines.forEach(line => {
    const p1 = getAbsoluteCoords(line, 'start');
    const p2 = getAbsoluteCoords(line, 'end');
    const lineLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);

    if (lineLen < 400 || lineLen > 1800) return;

    const matchingArc = unmappedArcs.find(arc => {
      const center = getAbsoluteCoords(arc, 'center');
      const d1 = Math.hypot(p1.x - center.x, p1.y - center.y);
      const d2 = Math.hypot(p2.x - center.x, p2.y - center.y);
      return Math.abs(d1 - lineLen) < 50 || Math.abs(d2 - lineLen) < 50;
    });

    if (matchingArc) {
      unmappedCount++;
      const arcCenter = getAbsoluteCoords(matchingArc, 'center');
      const dist1 = Math.hypot(p1.x - arcCenter.x, p1.y - arcCenter.y);
      const dist2 = Math.hypot(p2.x - arcCenter.x, p2.y - arcCenter.y);

      const hinge = dist1 < dist2 ? p1 : p2;
      const leafEnd = dist1 < dist2 ? p2 : p1;

      const vx = leafEnd.x - hinge.x;
      const vy = leafEnd.y - hinge.y;
      const wallAngle = Math.atan2(vy, vx);

      const ax = arcCenter.x - hinge.x;
      const ay = arcCenter.y - hinge.y;
      const isLeftHand = ((vx * ay) - (vy * ax)) > 0;
      const isOutward = ((vx * ax) + (vy * ay)) >= 0;

      doorPayloads.push(buildDoorPayload(
        line.id || `blue-door-${unmappedCount}`,
        unmappedCount,
        hinge.x, hinge.y,
        wallAngle, lineLen,
        2100.0,
        isOutward, isLeftHand,
        line.style,
        wallObjects
      ));
    }
  });

  return doorPayloads;
}

function buildDoorPayload(
  id: string,
  index: number,
  hingeX: number,
  hingeY: number,
  wallAngle: number,
  width: number,
  height: number,
  isOutward: boolean,
  isLeftHand: boolean,
  style: any,
  wallObjects: any[]
): DoorPayload {
  let closestWallId = "dwg-wall-root";
  let minDistance = Infinity;

  wallObjects.forEach(wall => {
    const pts = wall.points || (typeof wall.getPoints === 'function' ? wall.getPoints() : []);
    for (let i = 0; i < pts.length - 1; i++) {
      const dist = pointToSegmentDistance(
        hingeX, hingeY,
        pts[i][0], pts[i][1],
        pts[i+1][0], pts[i+1][1]
      );
      if (dist < minDistance && dist < 600) {
        minDistance = dist;
        closestWallId = wall.id || "wall-root";
      }
    }
  });

  return {
    id: id,
    type: "Door",
    name: `Door Aperture ${index}`,
    wallId: closestWallId,
    hingeX: Number(hingeX.toFixed(2)),
    hingeY: Number(hingeY.toFixed(2)),
    wallAngle: Number(normalizeAngle(wallAngle).toFixed(6)),
    width: Number(width.toFixed(2)),
    height: height,
    isOutward: Boolean(isOutward),
    isLeftHand: Boolean(isLeftHand),
    style: style || { strokeColor: "#3B82F6", strokeWidth: 1.5, opacity: 1.0 }
  };
}S