// src/modules/EmergencyLighting/models/EvacuationRoute.ts

export interface EvacuationRoute {
  id: string;
  name: string;

  // The full path. For single-segment routes this has exactly 2 entries.
  // For polylines it has N >= 2.
  points: Array<{ x: number; y: number }>;

  // Derived for backward compatibility. Always points[0] and points[last].
  startNode: { x: number; y: number };
  endNode: { x: number; y: number };

  lengthMeters: number;
  isCompliant: boolean;
}