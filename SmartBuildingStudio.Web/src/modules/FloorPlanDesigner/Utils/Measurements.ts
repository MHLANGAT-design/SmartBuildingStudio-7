import { Point2D } from "@/modules/FloorPlanDesigner/Utils/CoordinateTransforms";

export type EngineeringUnit = "mm" | "m" | "ft";

/**
 * Standardizes a length dimension scalar value into a readable string.
 */
export function formatLength(value: number, unit: EngineeringUnit = "m", scaleFactor: number = 1.0): string {
  const calibratedLength = value * scaleFactor;

  switch (unit) {
    case "mm":
      return `${Math.round(calibratedLength)} mm`;
    case "ft":
      return `${(calibratedLength * 3.28084).toFixed(2)} ft`;
    case "m":
    default:
      return `${calibratedLength.toFixed(2)} m`;
  }
}

/**
 * Employs the Shoelace Polygon algorithm to compute total floor space square meterage metrics.
 */
export function calculatePolygonArea(vertices: Point2D[], scaleFactor: number = 1.0): number {
  if (vertices.length < 3) return 0;
  
  let areaSum = 0;
  const totalPoints = vertices.length;

  for (let i = 0; i < totalPoints; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % totalPoints];
    areaSum += (current.x * next.y) - (next.x * current.y);
  }

  return Math.abs(areaSum / 2) * Math.pow(scaleFactor, 2);
}
