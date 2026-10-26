// src/modules/FloorPlanDesigner/core/types.ts

export enum DxfStructureType {
  CleanBlocks = 0,
  ExplodedGeometry = 1,
  Nested = 2
}

export enum ElementType {
  Wall = 0,
  Door = 1,
  Window = 2
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface VectorEntity {
  id: string;
  type: ElementType;
  originalLayer: string;
  points: Vector2D[];
  rotation: number;
}

/**
 * The render-ready plan produced by transformDbSchemaToCanvasSchema.
 *
 * `elements` is the primary render source — the raw DXF primitives that
 * CanvasRenderer step 6 iterates. The other collections are optional
 * structured views used by tools, editors, and the fixture pass.
 *
 * Fields added for the FloorPlanDesigner ↔ FixturePlacementStudio
 * round trip:
 *   - electricalFixtures: passed through from PlacedFixturesJson,
 *     consumed by CanvasRenderer.drawFixtures.
 *   - lightingZones: passed through from PlacedFixturesJson, currently
 *     not rendered but preserved so the save round trip keeps them.
 */
export interface ArchitecturalPlan {
  fileId?: string;
  fingerprint?: DxfStructureType;
  elements: VectorEntity[] | any[];

  // Structured collections (optional — populated by the transformer)
  walls?: any[];
  doors?: any[];
  windows?: any[];
  rooms?: any[];

  // FixturePlacementStudio-owned data carried through the plan
  electricalFixtures?: any[];
  lightingZones?: any[];
}