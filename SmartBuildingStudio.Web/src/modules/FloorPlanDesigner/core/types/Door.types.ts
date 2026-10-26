/**
 * DATABASE PAYLOAD SCHEMA
 * Stored directly in the database.
 */
export interface DoorDbPayload {
  id: string;
  type: 'Door';
  wallId: string;

  // Hinge anchor point (Canvas unit coordinates)
  hingeX: number;
  hingeY: number;

  // Wall direction angle in radians [0, 2π), measured clockwise from +X axis (Standard Canvas coordinates)
  wallAngle: number;

  // Geometry
  width: number;  // Leaf length (Canvas unit scale)
  height: number; // Vertical door height (mm / metadata)

  // Orientation state
  isOutward: boolean;   // True: swings to positive normal side (+90° relative to wall direction); False: negative normal side (-90°)
  isLeftHand: boolean;  // True: hinge is at start, swings along wall direction; False: hinge placement offset

  name?: string;
  properties?: Record<string, any>;
}

/**
 * CANONICAL DOOR DATA STRUCTURE
 * Used for rendering and runtime operations.
 */
export interface DoorData extends DoorDbPayload {
  style?: {
    strokeColor: string;
    strokeWidth: number;
    opacity: number;
    fillColor?: string;
  };
}

export interface Point2D {
  x: number;
  y: number;
}

export interface ArcParams {
  hinge: Point2D;
  radius: number;
  startAngle: number;
  endAngle: number;
  counterclockwise: boolean;
}

/**
 * Calculates the exact angular offset for the door leaf when open 90 degrees.
 * Handles screen-space (Y-down) coordinate mechanics unambiguously.
 */
export function getDoorSwingAngleOffset(door: Pick<DoorDbPayload, 'isOutward'>): number {
  // Outward swings +90 deg (+π/2), Inward swings -90 deg (-π/2) relative to wall vector
  return door.isOutward ? Math.PI / 2 : -Math.PI / 2;
}

/**
 * Returns the lock point coordinate when the door leaf is fully closed (parallel to wall).
 */
export function getClosedLockPoint(door: DoorDbPayload): Point2D {
  return {
    x: door.hingeX + door.width * Math.cos(door.wallAngle),
    y: door.hingeY + door.width * Math.sin(door.wallAngle),
  };
}

/**
 * Returns the lock point coordinate when the door leaf is opened 90°.
 */
export function getOpenLockPoint(door: DoorDbPayload): Point2D {
  const openAngle = door.wallAngle + getDoorSwingAngleOffset(door);
  return {
    x: door.hingeX + door.width * Math.cos(openAngle),
    y: door.hingeY + door.width * Math.sin(openAngle),
  };
}

/**
 * Derives exact parameters required for CanvasRenderingContext2D.arc()
 * or SVG Path A (Elliptical Arc) command execution.
 */
export function getDoorArcParams(door: DoorDbPayload): ArcParams {
  const startAngle = door.wallAngle;
  const endAngle = door.wallAngle + getDoorSwingAngleOffset(door);

  return {
    hinge: { x: door.hingeX, y: door.hingeY },
    radius: door.width,
    startAngle,
    endAngle,
    // In Canvas Y-down space, positive angle step (+π/2) moves Clockwise (counterclockwise = false).
    // Negative angle step (-π/2) moves Counter-Clockwise (counterclockwise = true).
    counterclockwise: !door.isOutward,
  };
}

/**
 * Calculates the bounding box encompassing the hinge, open leaf, closed leaf, and swing arc.
 * Useful for spatial indexing (e.g., R-Tree) and hit-box detection.
 */
export function getDoorBoundingBox(door: DoorDbPayload): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const closed = getClosedLockPoint(door);
  const open = getOpenLockPoint(door);

  const xs = [door.hingeX, closed.x, open.x];
  const ys = [door.hingeY, closed.y, open.y];

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}